--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: booking_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_type AS ENUM (
    'residential',
    'commercial',
    'termite',
    'rodent',
    'insect'
);


ALTER TYPE public.booking_type OWNER TO postgres;

--
-- Name: property_size; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_size AS ENUM (
    'small',
    'medium',
    'large',
    'commercial'
);


ALTER TYPE public.property_size OWNER TO postgres;

--
-- Name: update_admin_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_admin_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_admin_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    is_active boolean DEFAULT true,
    otp_verified boolean DEFAULT true,
    password_reset_required boolean DEFAULT false
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: TABLE admins; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.admins IS 'Stores administrator accounts with various permission levels';


--
-- Name: COLUMN admins.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.admins.created_by IS 'ID of the admin who created this account (NULL for initial developer-created admin)';


--
-- Name: COLUMN admins.password_reset_required; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.admins.password_reset_required IS 'Flag to indicate if admin needs to change password on next login';


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    booking_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    booking_type public.booking_type NOT NULL,
    property_size public.property_size NOT NULL,
    booking_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    estimated_duration integer,
    location text,
    location_phone character varying(20),
    location_email character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: COLUMN bookings.location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bookings.location IS 'Location address for the service';


--
-- Name: COLUMN bookings.location_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bookings.location_phone IS 'Phone number at the service location';


--
-- Name: COLUMN bookings.location_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bookings.location_email IS 'Email contact at the service location';


--
-- Name: cancellation_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cancellation_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'pending'::character varying,
    processed_by uuid,
    processed_at timestamp with time zone,
    admin_note text
);


ALTER TABLE public.cancellation_requests OWNER TO postgres;

--
-- Name: TABLE cancellation_requests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cancellation_requests IS 'Stores user cancellation requests before admin approval/rejection';


--
-- Name: otp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp integer NOT NULL,
    otp_expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.otp OWNER TO postgres;

--
-- Name: TABLE otp; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.otp IS 'Stores one-time passwords for email verification and password reset';


--
-- Name: otp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.otp_id_seq OWNER TO postgres;

--
-- Name: otp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_id_seq OWNED BY public.otp.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(20),
    password character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(255),
    otp_verified boolean DEFAULT false,
    suspended boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: otp id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp ALTER COLUMN id SET DEFAULT nextval('public.otp_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, name, email, password, created_by, created_at, updated_at, last_login, is_active, otp_verified, password_reset_required) FROM stdin;
a2826c93-6b65-4fe0-a825-b8800f408751	Test Admin	sharma.nikhil0306@gmail.com	$2b$10$cchHH2W7dB/d.AniVNHPq.W02yeiSUbIfhsqCrYr.QYBSStvU7cmy	34b209be-0a69-4073-86ab-63c1d66c382f	2025-03-16 17:51:43.843861+05:30	2025-03-16 17:51:43.843861+05:30	\N	t	t	t
34b209be-0a69-4073-86ab-63c1d66c382f	Admin User	organizational132@gmail.com	$2b$10$LUgox24IKo/kkm.JDLYKeums5IsX1mF/ZOSGOQTfRoqdlgyEKADTu	\N	2025-03-16 17:45:47.489188+05:30	2025-03-16 17:54:45.200039+05:30	2025-03-16 17:50:15.785263+05:30	t	t	f
77d2d5f9-f1c9-4757-b4b8-d3cd1049469c	Test Admin	testadmin@example.com	$2b$10$mFOVG0eI0XbLuV3Z/gSI6uL53ZP6DpuqVhRTXjgpWcXd6MBRVIdmm	34b209be-0a69-4073-86ab-63c1d66c382f	2025-03-16 17:51:09.954807+05:30	2025-03-16 18:01:56.02832+05:30	\N	f	t	t
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (booking_id, user_id, booking_type, property_size, booking_date, created_at, status, notes, estimated_duration, location, location_phone, location_email, updated_at) FROM stdin;
26768d87-ce8b-46cd-bf94-720a56aee7e3	38d93ba5-b359-4195-9b4c-7b652cbe8ee9	residential	medium	2025-03-18 13:20:48.62576+05:30	2025-03-16 13:20:48.62576+05:30	pending	\N	\N	\N	\N	\N	2025-03-16 17:01:22.521419+05:30
993ef085-f47c-4558-850a-45877247d2c0	6fa262e7-1f70-4aa4-a40b-cda8b282bea8	residential	medium	2025-03-28 01:12:00+05:30	2025-03-19 01:13:14.428662+05:30	pending	\N	\N	AFGAIGFIA	+61485207410	\N	2025-03-19 01:13:14.428662+05:30
\.


--
-- Data for Name: cancellation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cancellation_requests (id, booking_id, reason, created_at, status, processed_by, processed_at, admin_note) FROM stdin;
ecbac7b5-a7ae-4b35-a189-9c5638134e18	993ef085-f47c-4558-850a-45877247d2c0	BY MISTAKE	2025-03-19 01:14:08.921716+05:30	pending	\N	\N	\N
\.


--
-- Data for Name: otp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp (id, email, otp, otp_expires, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, phone_number, password, created_at, updated_at, name, otp_verified, suspended) FROM stdin;
38d93ba5-b359-4195-9b4c-7b652cbe8ee9	example@email.com	+1234567890	hashed_password_would_go_here	2025-03-16 13:10:36.611688+05:30	2025-03-16 13:10:36.611688+05:30	\N	f	f
ea1289f8-9fb1-4815-a297-06592e36d670	testuser@example.com	+61412345678	$2b$10$Z2JL0WFPX4o3fzTnM.3QI.3bweiA8fRrxtFNImgf.Iafn5ctqg/Ta	2025-03-16 14:40:25.976486+05:30	2025-03-16 14:40:25.976486+05:30	Test User	f	f
6fa262e7-1f70-4aa4-a40b-cda8b282bea8	madhavmahajan152@gmail.com	+61487654321	$2b$10$Gwb1sfWFFgNI3rdysOoKberUrmxN2Lz/f3bzB8BCwhvdijYcmOsu2	2025-03-19 01:10:47.271746+05:30	2025-03-19 01:10:47.271746+05:30	Madhav	t	f
\.


--
-- Name: otp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_id_seq', 6, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (booking_id);


--
-- Name: cancellation_requests cancellation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancellation_requests
    ADD CONSTRAINT cancellation_requests_pkey PRIMARY KEY (id);


--
-- Name: otp otp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp
    ADD CONSTRAINT otp_pkey PRIMARY KEY (id);


--
-- Name: cancellation_requests unique_booking_cancellation_request; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancellation_requests
    ADD CONSTRAINT unique_booking_cancellation_request UNIQUE (booking_id);


--
-- Name: otp unique_email_otp; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp
    ADD CONSTRAINT unique_email_otp UNIQUE (email);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_admins_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_email ON public.admins USING btree (email);


--
-- Name: idx_bookings_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_date ON public.bookings USING btree (booking_date);


--
-- Name: idx_bookings_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_type ON public.bookings USING btree (booking_type);


--
-- Name: idx_bookings_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);


--
-- Name: idx_cancellation_requests_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cancellation_requests_booking_id ON public.cancellation_requests USING btree (booking_id);


--
-- Name: idx_cancellation_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cancellation_requests_status ON public.cancellation_requests USING btree (status);


--
-- Name: idx_otp_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_email ON public.otp USING btree (email);


--
-- Name: idx_otp_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_expires ON public.otp USING btree (otp_expires);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: admins update_admin_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_timestamp BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_admin_updated_at();


--
-- Name: admins admins_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cancellation_requests cancellation_requests_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancellation_requests
    ADD CONSTRAINT cancellation_requests_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- Name: cancellation_requests cancellation_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancellation_requests
    ADD CONSTRAINT cancellation_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.admins(id);


--
-- PostgreSQL database dump complete
--

