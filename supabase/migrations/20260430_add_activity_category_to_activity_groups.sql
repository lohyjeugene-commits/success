alter table public.activity_groups
add column if not exists activity_category text;

alter table public.activity_groups
alter column activity_category set default 'Other';

update public.activity_groups
set activity_category = case
  when activity_type in (
    'Cafe Hopping',
    'Casual Chat',
    'Food Hunt',
    'Karaoke',
    'Movie',
    'Shopping',
    'Supper',
    'Window Shopping'
  ) then 'Chill & Hangout'
  when activity_type in (
    'Calligraphy',
    'Crafts',
    'Crochet',
    'Drawing',
    'Embroidery',
    'Knitting',
    'Painting',
    'Photography',
    'Pottery',
    'Sculpting',
    'Sewing',
    'Sketching',
    'Videography'
  ) then 'Creatives & Hobbies'
  when activity_type in (
    'Board Games',
    'Chess',
    'Console Gaming',
    'Dungeons & Dragons',
    'LAN Gaming',
    'Mobile Gaming',
    'Online Chat',
    'PC Gaming',
    'Tabletop Games'
  ) then 'Gaming & Online'
  when activity_type in (
    'Beach',
    'Camping',
    'Cycling',
    'Exploring Neighbourhoods',
    'Hiking',
    'Nature Walk',
    'Picnic',
    'Skating',
    'Urban Exploring',
    'Walking'
  ) then 'Outdoor & Exploration'
  when activity_type in (
    'Book Club',
    'Career Talk',
    'Coding',
    'Finance Discussion',
    'Language Learning',
    'Networking',
    'Public Speaking',
    'Reading',
    'Skill Swap'
  ) then 'Self Improvement'
  when activity_type in (
    'Festival',
    'Group Dinner',
    'Meet New Friends',
    'Museum Visit',
    'Networking Event',
    'Party',
    'Volunteer Activity',
    'Workshop'
  ) then 'Social & Events'
  when activity_type in (
    'Badminton',
    'Basketball',
    'Climbing',
    'Dance',
    'Football',
    'Gym',
    'Running',
    'Swimming',
    'Table Tennis',
    'Tennis',
    'Volleyball',
    'Yoga'
  ) then 'Sports & Fitness'
  when activity_type in (
    'Accountability Session',
    'Co-working',
    'Exam Revision',
    'Group Study',
    'Homework',
    'Library Study',
    'Project Work',
    'Quiet Study',
    'Study Cafe'
  ) then 'Study & Productivity'
  else 'Other'
end
where activity_category is null
   or activity_category not in (
     'Chill & Hangout',
     'Creatives & Hobbies',
     'Gaming & Online',
     'Outdoor & Exploration',
     'Self Improvement',
     'Social & Events',
     'Sports & Fitness',
     'Study & Productivity',
     'Other'
   );

alter table public.activity_groups
drop constraint if exists activity_groups_activity_category_check;

alter table public.activity_groups
add constraint activity_groups_activity_category_check
check (
  activity_category is null
  or activity_category in (
    'Chill & Hangout',
    'Creatives & Hobbies',
    'Gaming & Online',
    'Outdoor & Exploration',
    'Self Improvement',
    'Social & Events',
    'Sports & Fitness',
    'Study & Productivity',
    'Other'
  )
);

create index if not exists activity_groups_activity_category_idx
on public.activity_groups (activity_category);
