type SectionHeadingProps = { title: string; meta?: string }
export function SectionHeading({ title, meta }: SectionHeadingProps) { return <div className="section-head"><h2>{title}</h2>{meta && <span>{meta}</span>}</div> }
