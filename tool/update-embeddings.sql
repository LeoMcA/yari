create table
  public.mdn_doc (
    id bigint not null default nextval('mdn_doc_id_seq'::regclass),
    slug text not null,
    checksum text null,
    constraint mdn_doc_pkey primary key (id),
    constraint mdn_doc_path_key unique (slug)
  ) tablespace pg_default;

  create table
  public.mdn_doc_section (
    id bigint not null default nextval('mdn_doc_section_id_seq'::regclass),
    doc_id bigint not null,
    heading text null,
    content text null,
    token_count integer null,
    embedding public.vector null,
    constraint mdn_doc_section_pkey primary key (id),
    constraint mdn_doc_section_doc_id_fkey foreign key (doc_id) references mdn_doc (id) on delete cascade
  ) tablespace pg_default;