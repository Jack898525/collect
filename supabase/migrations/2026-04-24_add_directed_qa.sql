create extension if not exists pgcrypto;

create table if not exists directed_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists directed_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references directed_questions(id) on delete cascade,
  student_name text not null,
  student_id text not null,
  nickname text not null,
  answer text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  is_adopted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists directed_answers_question_id_idx on directed_answers(question_id);
create index if not exists directed_answers_student_id_idx on directed_answers(student_id);
create index if not exists directed_answers_question_student_idx on directed_answers(question_id, student_id);

create or replace view directed_answers_public as
select
  id,
  question_id,
  student_id,
  nickname,
  answer,
  status,
  is_adopted,
  created_at
from directed_answers;
