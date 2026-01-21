-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'designer', 'furniture_shop', 'user');

-- Create enum for notification preferences
CREATE TYPE public.notification_preference AS ENUM ('email', 'whatsapp', 'both');

-- Create enum for offer status
CREATE TYPE public.offer_status AS ENUM ('pending', 'sent', 'viewed', 'accepted', 'rejected');

-- Create enum for invite status
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Invite tokens for designers and shops
CREATE TABLE public.role_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    email TEXT,
    role app_role NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status invite_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shop/Designer profile extensions
CREATE TABLE public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    phone TEXT,
    credits_balance INTEGER NOT NULL DEFAULT 5,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table for furniture shops
CREATE TABLE public.shop_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    style TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    image_urls TEXT[] DEFAULT '{}',
    source_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User-product matches (AI-generated suggestions)
CREATE TABLE public.product_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.shop_products(id) ON DELETE CASCADE NOT NULL,
    quiz_response_id UUID REFERENCES public.quiz_responses(id) ON DELETE SET NULL,
    match_score DECIMAL(3,2) NOT NULL,
    match_reasons TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Individual offers from shops/designers to users
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    offer_type TEXT NOT NULL, -- 'product', 'service', 'consultation'
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    product_ids UUID[] DEFAULT '{}',
    status offer_status NOT NULL DEFAULT 'pending',
    credits_used INTEGER NOT NULL DEFAULT 1,
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User notification preferences
CREATE TABLE public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    preference notification_preference NOT NULL DEFAULT 'email',
    email TEXT,
    phone TEXT,
    whatsapp_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin CMS content table
CREATE TABLE public.cms_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    content_type TEXT NOT NULL, -- 'text', 'image', 'html', 'json'
    value TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Credit transactions log
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'bonus', 'refund'
    description TEXT,
    stripe_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for role_invites
CREATE POLICY "Admins can manage invites"
ON public.role_invites FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view invite by token"
ON public.role_invites FOR SELECT
USING (true);

-- RLS Policies for business_profiles
CREATE POLICY "Users can view own business profile"
ON public.business_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile"
ON public.business_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profile"
ON public.business_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active business profiles"
ON public.business_profiles FOR SELECT
USING (true);

-- RLS Policies for shop_products
CREATE POLICY "Shops can manage own products"
ON public.shop_products FOR ALL
USING (auth.uid() = shop_id);

CREATE POLICY "Public can view active products"
ON public.shop_products FOR SELECT
USING (is_active = true);

-- RLS Policies for product_matches
CREATE POLICY "Users can view own matches"
ON public.product_matches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Designers and shops can view matches"
ON public.product_matches FOR SELECT
USING (
  public.has_role(auth.uid(), 'designer') OR 
  public.has_role(auth.uid(), 'furniture_shop') OR
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for offers
CREATE POLICY "Users can view offers sent to them"
ON public.offers FOR SELECT
USING (auth.uid() = to_user_id);

CREATE POLICY "Senders can manage their offers"
ON public.offers FOR ALL
USING (auth.uid() = from_user_id);

CREATE POLICY "Admins can view all offers"
ON public.offers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notification_settings
CREATE POLICY "Users can manage own notification settings"
ON public.notification_settings FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for cms_content
CREATE POLICY "Public can view cms content"
ON public.cms_content FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cms content"
ON public.cms_content FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
ON public.credit_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_products_updated_at
BEFORE UPDATE ON public.shop_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_content_updated_at
BEFORE UPDATE ON public.cms_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to assign role from invite
CREATE OR REPLACE FUNCTION public.accept_invite(invite_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record role_invites%ROWTYPE;
BEGIN
  -- Get the invite
  SELECT * INTO invite_record 
  FROM role_invites 
  WHERE token = invite_token 
    AND status = 'pending' 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Insert the role
  INSERT INTO user_roles (user_id, role)
  VALUES (auth.uid(), invite_record.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update invite status
  UPDATE role_invites 
  SET status = 'accepted', used_by = auth.uid()
  WHERE id = invite_record.id;
  
  -- Create business profile for shops/designers
  IF invite_record.role IN ('designer', 'furniture_shop') THEN
    INSERT INTO business_profiles (user_id, business_name)
    VALUES (auth.uid(), 'New Business')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to deduct credits when sending offers
CREATE OR REPLACE FUNCTION public.deduct_credits(_user_id UUID, _amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT credits_balance INTO current_balance
  FROM business_profiles
  WHERE user_id = _user_id;
  
  IF current_balance IS NULL OR current_balance < _amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE business_profiles
  SET credits_balance = credits_balance - _amount
  WHERE user_id = _user_id;
  
  INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
  VALUES (_user_id, -_amount, 'usage', 'Offer sent');
  
  RETURN TRUE;
END;
$$;