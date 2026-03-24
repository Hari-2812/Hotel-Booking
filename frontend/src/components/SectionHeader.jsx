export default function SectionHeader({ eyebrow, title, description, align = 'left' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : '';

  return (
    <div className={alignment}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{description}</p> : null}
    </div>
  );
}
