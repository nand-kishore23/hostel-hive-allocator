
-- Enums
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE public.room_status AS ENUM ('available', 'full', 'maintenance');
CREATE TYPE public.room_type_enum AS ENUM ('single', 'double', 'triple', 'quad');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.allocation_status AS ENUM ('active', 'vacated');
CREATE TYPE public.complaint_status AS ENUM ('open', 'in-progress', 'resolved');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  course TEXT,
  year INTEGER,
  gender public.gender_type NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles (separate table to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  block_name TEXT NOT NULL,
  floor INTEGER NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  occupied_beds INTEGER NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0),
  room_type public.room_type_enum NOT NULL DEFAULT 'double',
  gender public.gender_type NOT NULL,
  status public.room_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (block_name, room_number),
  CHECK (occupied_beds <= capacity)
);

-- Allocation requests
CREATE TABLE public.allocation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_block TEXT,
  preferred_room_type public.room_type_enum,
  special_request TEXT,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Allocations
CREATE TABLE public.allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.allocation_status NOT NULL DEFAULT 'active'
);
CREATE UNIQUE INDEX one_active_allocation_per_student ON public.allocations(student_id) WHERE status = 'active';

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status public.complaint_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, course, year, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'course',
    NULLIF(NEW.raw_user_meta_data->>'year','')::INTEGER,
    COALESCE((NEW.raw_user_meta_data->>'gender')::public.gender_type, 'other')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update room occupancy on allocation insert/update
CREATE OR REPLACE FUNCTION public.sync_room_occupancy()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_capacity INTEGER;
  v_occupied INTEGER;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') THEN
    SELECT capacity, occupied_beds INTO v_capacity, v_occupied FROM public.rooms WHERE id = NEW.room_id FOR UPDATE;
    IF v_occupied >= v_capacity THEN
      RAISE EXCEPTION 'Room is at full capacity';
    END IF;
    UPDATE public.rooms SET occupied_beds = occupied_beds + 1,
      status = CASE WHEN occupied_beds + 1 >= capacity THEN 'full'::public.room_status ELSE status END
    WHERE id = NEW.room_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'vacated') THEN
    UPDATE public.rooms SET occupied_beds = GREATEST(occupied_beds - 1, 0),
      status = CASE WHEN status = 'full' THEN 'available'::public.room_status ELSE status END
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_alloc_occupancy
AFTER INSERT OR UPDATE ON public.allocations
FOR EACH ROW EXECUTE FUNCTION public.sync_room_occupancy();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- user_roles policies (read own, admins read all; no client writes)
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Rooms: everyone authed reads; admins manage
CREATE POLICY "Authed read rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage rooms" ON public.rooms FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Allocation requests
CREATE POLICY "Students view own requests" ON public.allocation_requests FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins view all requests" ON public.allocation_requests FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Students create own requests" ON public.allocation_requests FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins update requests" ON public.allocation_requests FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- Allocations
CREATE POLICY "Students view own allocations" ON public.allocations FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins view all allocations" ON public.allocations FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage allocations" ON public.allocations FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Complaints
CREATE POLICY "Students view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins view all complaints" ON public.complaints FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Students create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins update complaints" ON public.complaints FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
