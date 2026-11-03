-- Create knowledge_base table for storing AI assistant knowledge articles
create table public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'general',
  tags text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for search and filtering
create index knowledge_base_category_idx on public.knowledge_base (category);
create index knowledge_base_is_active_idx on public.knowledge_base (is_active);
create index knowledge_base_created_at_idx on public.knowledge_base (created_at desc);

-- Enable full text search on title and content
create index knowledge_base_title_search_idx on public.knowledge_base using gin(to_tsvector('english', title));
create index knowledge_base_content_search_idx on public.knowledge_base using gin(to_tsvector('english', content));

-- Grant permissions
grant select on public.knowledge_base to authenticated;
grant all on public.knowledge_base to service_role;

-- Enable RLS
alter table public.knowledge_base enable row level security;

-- RLS policies
create policy "Active users can read active knowledge base articles" 
  on public.knowledge_base for select to authenticated
  using (public.is_active_user(auth.uid()) and is_active = true);

create policy "Admins can read all knowledge base articles" 
  on public.knowledge_base for select to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert knowledge base articles" 
  on public.knowledge_base for insert to authenticated
  with check (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update knowledge base articles" 
  on public.knowledge_base for update to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete knowledge base articles" 
  on public.knowledge_base for delete to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
create trigger knowledge_base_touch 
  before update on public.knowledge_base 
  for each row execute function public.touch_updated_at();

-- Insert some sample knowledge base articles
insert into public.knowledge_base (title, content, category, tags) values
  ('Company Hours', 'We are open Monday through Friday, 9 AM to 6 PM EST. Closed on weekends and major holidays.', 'general', ARRAY['hours', 'schedule']),
  ('Product Returns', 'Products can be returned within 30 days of purchase with original receipt. Items must be in original condition.', 'support', ARRAY['returns', 'policy']),
  ('Shipping Information', 'Standard shipping takes 5-7 business days. Express shipping available for 2-3 day delivery.', 'support', ARRAY['shipping', 'delivery']),
  ('Contact Support', 'For technical support, email support@example.com or call 1-800-SUPPORT. Average response time is 24 hours.', 'support', ARRAY['contact', 'help']);
