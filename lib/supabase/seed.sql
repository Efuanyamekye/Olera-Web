-- Seed Script: 20 realistic provider profiles for development
-- Run this AFTER schema.sql in the Supabase SQL editor.
-- These profiles are unclaimed/seeded, simulating pre-populated directory data.

insert into public.profiles (slug, type, category, display_name, description, image_url, phone, email, website, address, city, state, zip, lat, lng, service_area, care_types, metadata, claim_state, verification_state, source)
values
-- ============================================================
-- FACILITY-BASED PROVIDERS
-- ============================================================
(
  'sunrise-senior-living-austin-tx',
  'organization', 'assisted_living',
  'Sunrise Senior Living',
  'A warm, welcoming community offering personalized assisted living and memory care. Our team helps residents maintain independence while providing support with daily activities.',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
  '(512) 555-0101', 'info@sunrisesenior.example.com', 'https://sunrisesenior.example.com',
  '1234 Oak Street', 'Austin', 'TX', '78701', 30.2672, -97.7431, null,
  '{Assisted Living,Memory Care,Respite Care}',
  '{"bed_count": 120, "year_founded": 2005, "accepts_medicaid": true, "accepts_medicare": false, "amenities": ["Garden", "Library", "Fitness Center", "Chapel", "Beauty Salon"], "price_range": "$3,500-5,000/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'harmony-memory-care-austin-tx',
  'organization', 'memory_care',
  'Harmony Memory Care',
  'Specialized memory care community with secure, home-like neighborhoods. Our evidence-based programs support residents living with Alzheimer''s and other forms of dementia.',
  'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800',
  '(512) 555-0102', 'hello@harmonymemory.example.com', null,
  '5678 Maple Avenue', 'Austin', 'TX', '78702', 30.2550, -97.7200, null,
  '{Memory Care,Hospice}',
  '{"bed_count": 48, "year_founded": 2012, "accepts_medicaid": false, "accepts_medicare": false, "amenities": ["Sensory Garden", "Music Therapy Room", "Secure Courtyard"], "price_range": "$4,200-6,500/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'golden-years-residence-austin-tx',
  'organization', 'independent_living',
  'Golden Years Residence',
  'An active adult community for independent seniors who want a vibrant social life with the convenience of on-site dining, fitness, and cultural programs.',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800',
  '(512) 555-0103', null, 'https://goldenyears.example.com',
  '910 Pine Road', 'Austin', 'TX', '78703', 30.2900, -97.7600, null,
  '{Independent Living,Assisted Living}',
  '{"bed_count": 200, "year_founded": 1998, "accepts_medicaid": false, "accepts_medicare": false, "amenities": ["Pool", "Golf Putting Green", "Art Studio", "Movie Theater", "Restaurant"], "price_range": "$2,800-4,200/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'hill-country-nursing-rehab-austin-tx',
  'organization', 'nursing_home',
  'Hill Country Nursing & Rehab',
  'Providing 24/7 skilled nursing care and short-term rehabilitation. Our clinical team includes registered nurses, physical therapists, and occupational therapists.',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
  '(512) 555-0104', 'admissions@hillcountrynursing.example.com', null,
  '2200 Cedar Lane', 'Austin', 'TX', '78704', 30.2400, -97.7700, null,
  '{Skilled Nursing,Rehabilitation,Respite Care}',
  '{"bed_count": 80, "year_founded": 2001, "accepts_medicaid": true, "accepts_medicare": true, "amenities": ["Physical Therapy Gym", "Occupational Therapy Suite", "Outdoor Walking Path"], "price_range": "$6,000-9,000/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'peaceful-pines-hospice-austin-tx',
  'organization', 'inpatient_hospice',
  'Peaceful Pines Hospice Center',
  'A calm, dignified environment for end-of-life care. We focus on comfort, pain management, and family support during life''s most difficult moments.',
  'https://images.unsplash.com/photo-1551190822-a9ce113ac100?w=800',
  '(512) 555-0105', 'care@peacefulpines.example.com', null,
  '4400 Willow Creek Drive', 'Austin', 'TX', '78745', 30.2100, -97.7900, null,
  '{Hospice}',
  '{"bed_count": 24, "year_founded": 2010, "accepts_medicaid": true, "accepts_medicare": true, "amenities": ["Family Suites", "Meditation Garden", "Chapel", "Kitchen for Families"]}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'bright-horizons-adult-day-austin-tx',
  'organization', 'adult_day_care',
  'Bright Horizons Adult Day Center',
  'Daytime enrichment and supervision for seniors who need structured activities and social connection. A great option for families who need daytime support.',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
  '(512) 555-0106', null, null,
  '3300 Congress Avenue', 'Austin', 'TX', '78704', 30.2500, -97.7450, null,
  '{Adult Day Care}',
  '{"year_founded": 2015, "amenities": ["Art Room", "Exercise Class", "Hot Lunch Program", "Transportation Available"], "hours": "Mon-Fri 7:30am-5:30pm", "price_range": "$75-120/day"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'lakeview-rehab-center-austin-tx',
  'organization', 'rehab_facility',
  'Lakeview Rehabilitation Center',
  'Short-term rehabilitation following surgery, stroke, or injury. Our goal is to get patients home safely and independently as quickly as possible.',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
  '(512) 555-0107', 'intake@lakeviewrehab.example.com', 'https://lakeviewrehab.example.com',
  '7700 Lakeline Boulevard', 'Austin', 'TX', '78717', 30.4700, -97.7950, null,
  '{Rehabilitation,Skilled Nursing}',
  '{"bed_count": 60, "year_founded": 2008, "accepts_medicaid": false, "accepts_medicare": true, "amenities": ["Aquatic Therapy Pool", "PT/OT Gym", "Speech Therapy"]}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),

-- ============================================================
-- HOME-BASED PROVIDERS
-- ============================================================
(
  'caring-hearts-home-care-austin-tx',
  'organization', 'home_care_agency',
  'Caring Hearts Home Care',
  'Non-medical home care services including companionship, meal preparation, light housekeeping, and transportation. We help seniors stay safe and comfortable at home.',
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800',
  '(512) 555-0201', 'schedule@caringhearts.example.com', 'https://caringhearts.example.com',
  null, 'Austin', 'TX', '78701', 30.2672, -97.7431, 'Greater Austin Area',
  '{Home Care,Companion Care,Respite Care}',
  '{"year_founded": 2011, "staff_count": 45, "price_range": "$25-45/hr"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'austin-home-health-services-austin-tx',
  'organization', 'home_health_agency',
  'Austin Home Health Services',
  'Medicare-certified home health agency providing skilled nursing, physical therapy, and occupational therapy in the comfort of your home.',
  'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800',
  '(512) 555-0202', 'referrals@austinhomehealth.example.com', null,
  null, 'Austin', 'TX', '78701', 30.2672, -97.7431, 'Travis County & Williamson County',
  '{Home Health,Skilled Nursing,Physical Therapy}',
  '{"year_founded": 2006, "staff_count": 80, "accepts_medicaid": true, "accepts_medicare": true}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'grace-hospice-care-austin-tx',
  'organization', 'hospice_agency',
  'Grace Hospice Care',
  'In-home hospice services focused on comfort, dignity, and family support. Our interdisciplinary team includes nurses, chaplains, social workers, and volunteers.',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
  '(512) 555-0203', 'intake@gracehospice.example.com', null,
  null, 'Austin', 'TX', '78701', 30.2672, -97.7431, 'Central Texas',
  '{Hospice,Palliative Care}',
  '{"year_founded": 2014, "staff_count": 35, "accepts_medicaid": true, "accepts_medicare": true}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'comfort-keepers-round-rock-tx',
  'organization', 'home_care_agency',
  'Comfort Keepers of Round Rock',
  'Trusted in-home care helping seniors maintain their independence. Services include personal care, meal prep, medication reminders, and transportation.',
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800',
  '(512) 555-0204', null, 'https://comfortkeepers-roundrock.example.com',
  null, 'Round Rock', 'TX', '78664', 30.5083, -97.6789, 'Round Rock & Cedar Park',
  '{Home Care,Companion Care}',
  '{"year_founded": 2009, "staff_count": 30, "price_range": "$22-38/hr"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),

-- ============================================================
-- SAN ANTONIO PROVIDERS (different city to test location filtering)
-- ============================================================
(
  'alamo-senior-living-san-antonio-tx',
  'organization', 'assisted_living',
  'Alamo Senior Living',
  'Family-owned assisted living community in the heart of San Antonio. Small, intimate setting with a 1:6 caregiver-to-resident ratio.',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
  '(210) 555-0301', null, null,
  '500 Riverwalk Blvd', 'San Antonio', 'TX', '78205', 29.4241, -98.4936, null,
  '{Assisted Living,Respite Care}',
  '{"bed_count": 36, "year_founded": 2013, "amenities": ["Courtyard", "Library", "Activity Room"], "price_range": "$3,000-4,500/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'mission-memory-care-san-antonio-tx',
  'organization', 'memory_care',
  'Mission Memory Care',
  'Purpose-built memory care community using the latest research in dementia care. Secure environment with engaging daily programs.',
  'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800',
  '(210) 555-0302', 'info@missionmemory.example.com', null,
  '1800 Mission Road', 'San Antonio', 'TX', '78210', 29.3900, -98.4800, null,
  '{Memory Care}',
  '{"bed_count": 40, "year_founded": 2017, "amenities": ["Sensory Room", "Secure Garden", "Music Program"], "price_range": "$4,800-7,000/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),

-- ============================================================
-- HOUSTON PROVIDERS
-- ============================================================
(
  'magnolia-place-independent-living-houston-tx',
  'organization', 'independent_living',
  'Magnolia Place',
  'Resort-style independent living for active adults 55+. Enjoy chef-prepared meals, fitness classes, and a full social calendar.',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800',
  '(713) 555-0401', null, 'https://magnoliaplace.example.com',
  '9900 Memorial Drive', 'Houston', 'TX', '77024', 29.7750, -95.5500, null,
  '{Independent Living}',
  '{"bed_count": 180, "year_founded": 2002, "amenities": ["Pool", "Spa", "Theater", "Putting Green", "Woodworking Shop"], "price_range": "$3,200-5,500/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'bayou-city-home-care-houston-tx',
  'organization', 'home_care_agency',
  'Bayou City Home Care',
  'Reliable, compassionate home care for Houston-area seniors. Our caregivers are background-checked, trained, and supervised.',
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800',
  '(713) 555-0402', 'info@bayoucityhomecare.example.com', null,
  null, 'Houston', 'TX', '77001', 29.7604, -95.3698, 'Greater Houston Area',
  '{Home Care,Companion Care,Respite Care}',
  '{"year_founded": 2016, "staff_count": 60, "price_range": "$23-40/hr"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),

-- ============================================================
-- DALLAS PROVIDERS
-- ============================================================
(
  'heritage-oaks-nursing-dallas-tx',
  'organization', 'nursing_home',
  'Heritage Oaks Nursing Center',
  'Skilled nursing facility offering long-term care and post-acute rehabilitation. Our interdisciplinary team is committed to restoring health and function.',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
  '(214) 555-0501', 'admissions@heritageoaks.example.com', null,
  '4500 Oak Lawn Avenue', 'Dallas', 'TX', '75219', 32.8100, -96.8100, null,
  '{Skilled Nursing,Rehabilitation,Long-Term Care}',
  '{"bed_count": 100, "year_founded": 1995, "accepts_medicaid": true, "accepts_medicare": true, "amenities": ["Therapy Gym", "Courtyard", "Beauty Salon"], "price_range": "$5,500-8,500/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'lakewood-wellness-center-dallas-tx',
  'organization', 'wellness_center',
  'Lakewood Senior Wellness Center',
  'Community wellness center offering fitness programs, health screenings, social events, and educational workshops for adults 55+.',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
  '(214) 555-0502', null, null,
  '6800 Gaston Avenue', 'Dallas', 'TX', '75214', 32.8000, -96.7600, null,
  '{Wellness,Social Programs}',
  '{"year_founded": 2018, "amenities": ["Fitness Room", "Computer Lab", "Craft Room", "Walking Trail"], "hours": "Mon-Sat 8am-6pm"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),

-- ============================================================
-- ONE MORE AUSTIN PROVIDER (to have more density for testing)
-- ============================================================
(
  'westlake-assisted-living-austin-tx',
  'organization', 'assisted_living',
  'Westlake Assisted Living',
  'Boutique assisted living community in West Austin. Personalized care plans, farm-to-table dining, and a focus on whole-person wellness.',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
  '(512) 555-0108', 'info@westlakeassisted.example.com', 'https://westlakeassisted.example.com',
  '3600 Bee Caves Road', 'Austin', 'TX', '78746', 30.3100, -97.8200, null,
  '{Assisted Living,Memory Care}',
  '{"bed_count": 56, "year_founded": 2019, "accepts_medicaid": false, "accepts_medicare": false, "amenities": ["Rooftop Garden", "Yoga Studio", "Chef Kitchen", "Salon"], "price_range": "$4,500-7,000/mo"}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
),
(
  'texas-senior-home-health-austin-tx',
  'organization', 'home_health_agency',
  'Texas Senior Home Health',
  'Providing skilled nursing and therapy services at home. Our clinicians coordinate closely with your physician to support recovery and health goals.',
  'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800',
  '(512) 555-0109', null, null,
  null, 'Austin', 'TX', '78701', 30.2672, -97.7431, 'Austin Metro Area',
  '{Home Health,Skilled Nursing,Occupational Therapy}',
  '{"year_founded": 2010, "staff_count": 55, "accepts_medicaid": true, "accepts_medicare": true}'::jsonb,
  'unclaimed', 'unverified', 'seeded'
);
