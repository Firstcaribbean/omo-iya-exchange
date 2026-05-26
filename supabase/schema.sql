create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  role text not null default 'CUSTOMER' check (role in ('CUSTOMER', 'ADMIN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  region text not null default 'Global',
  country text not null default 'Multi-country',
  availability integer not null default 0,
  fulfillment_window text not null default '24-72 hours',
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  rating numeric(3,2) not null default 5,
  sales integer not null default 0,
  image text not null default '',
  badge text not null default 'Verified',
  description text not null default '',
  delivery text not null default 'Managed setup',
  includes text[] not null default array['Onboarding support'],
  requires_otp boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_settings (
  id integer primary key default 1 check (id = 1),
  name text not null,
  tagline text not null,
  support_email text not null,
  whatsapp text not null,
  hero_title text not null,
  hero_copy text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  total numeric(12,2) not null default 0,
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'FULFILLED')),
  otp_code text not null default '',
  fulfillment_note text not null default '',
  paystack_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  name text not null,
  price numeric(12,2) not null,
  quantity integer not null default 1
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  message text not null default '',
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  channel text not null default 'SUPPORT' check (channel in ('CHAT', 'SUPPORT')),
  assigned_to_agent boolean not null default true,
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender text not null check (sender in ('CUSTOMER', 'AI', 'AGENT', 'SYSTEM')),
  text text not null,
  created_at timestamptz not null default now()
);

insert into public.brand_settings (id, name, tagline, support_email, whatsapp, hero_title, hero_copy)
values (
  1,
  'Omo Iya Exchange',
  'Secure Digital Marketplace',
  'support@omoiyaexchange.com',
  '+234 800 000 0000',
  'Omo Iya Exchange',
  'Browse compliant setup services with region filters, country availability, NGN pricing, and Paystack-ready checkout.'
)
on conflict (id) do nothing;

insert into public.categories (name, slug, description) values
  ('WhatsApp Business Setup', 'whatsapp-business-setup', 'WhatsApp Business onboarding and number setup services.'),
  ('Business Account Setup', 'business-account-setup', 'Compliant business account setup and launch support.'),
  ('SIM Registration Assistance', 'sim-registration-assistance', 'Provider-aligned SIM registration assistance.'),
  ('Compliance Consultation', 'compliance-consultation', 'Regional compliance planning and onboarding consultations.')
on conflict (slug) do nothing;

insert into public.products (
  id, slug, name, category, region, country, availability, fulfillment_window, price, old_price,
  rating, sales, image, badge, description, delivery, includes, requires_otp
) values
  (
    'ng-whatsapp-business-setup',
    'nigeria-whatsapp-business-number-setup',
    'Nigeria WhatsApp Business Number Setup',
    'WhatsApp Business Setup',
    'West Africa',
    'Nigeria',
    42,
    '24-48 hours',
    28500,
    34000,
    4.9,
    318,
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=900&q=80',
    'High availability',
    'Compliant WhatsApp Business onboarding for buyer-owned brands, including number registration guidance, profile setup, catalog basics, and handover support.',
    'Managed setup',
    array['Business profile setup', 'Catalog starter setup', 'Number onboarding guidance', 'Handover checklist'],
    true
  ),
  (
    'gh-whatsapp-business-setup',
    'ghana-whatsapp-business-number-setup',
    'Ghana WhatsApp Business Number Setup',
    'WhatsApp Business Setup',
    'West Africa',
    'Ghana',
    18,
    '24-72 hours',
    31500,
    null,
    4.8,
    204,
    'https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?auto=format&fit=crop&w=900&q=80',
    'Limited slots',
    'Region-specific WhatsApp Business setup for Ghanaian businesses, with compliance review, brand profile configuration, and buyer-controlled handover.',
    'Managed setup',
    array['Eligibility check', 'Profile configuration', 'Security handover', 'Support window'],
    true
  ),
  (
    'uk-business-account-setup',
    'uk-business-account-setup-service',
    'UK Business Account Setup Service',
    'Business Account Setup',
    'Europe',
    'United Kingdom',
    11,
    '2-4 business days',
    54000,
    62000,
    4.7,
    156,
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80',
    'Verified',
    'Guided setup for buyer-owned business accounts using buyer-provided details, with compliance checks, recovery setup, and onboarding documentation.',
    'Guided onboarding',
    array['Requirement review', 'Account setup session', 'Recovery configuration', 'Completion proof'],
    true
  ),
  (
    'us-brand-page-setup',
    'us-brand-page-setup-package',
    'US Brand Page Setup Package',
    'Business Account Setup',
    'North America',
    'United States',
    25,
    '1-3 business days',
    48000,
    null,
    4.9,
    91,
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    'Premium',
    'Business page creation and launch support for buyer-owned brands, including profile setup, starter content, permissions, and security checklist.',
    'Managed setup',
    array['Brand profile setup', 'Starter content', 'Admin permission review', 'Security checklist'],
    false
  ),
  (
    'ng-sim-registration-assist',
    'nigeria-sim-registration-assistance',
    'Nigeria SIM Registration Assistance',
    'SIM Registration Assistance',
    'West Africa',
    'Nigeria',
    64,
    'Same day-48 hours',
    17500,
    null,
    4.6,
    127,
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    'Available',
    'Provider-aligned assistance for lawful SIM onboarding where the buyer supplies required identity information and completes any mandatory verification.',
    'Assisted onboarding',
    array['Provider availability check', 'Registration guidance', 'Verification reminders', 'Activation support'],
    true
  ),
  (
    'global-onboarding-consult',
    'global-account-onboarding-consultation',
    'Global Account Onboarding Consultation',
    'Compliance Consultation',
    'Global',
    'Multi-country',
    9,
    'Booked within 48 hours',
    22500,
    null,
    4.7,
    83,
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80',
    'Consultation',
    'Planning call for businesses that need compliant setup across regions, provider requirements, documentation, and launch workflow.',
    'Video/phone consultation',
    array['Region planning', 'Provider checklist', 'Risk review', 'Launch roadmap'],
    false
  )
on conflict (id) do update set
  availability = excluded.availability,
  price = excluded.price,
  updated_at = now();
