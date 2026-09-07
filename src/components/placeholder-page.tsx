export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <div className="page-intro">
        <h1>{title}</h1>
        <p className="lede">{description}</p>
      </div>
      <article className="card empty-state">
        <h2>This space is under development</h2>
        <p>The route is ready and the foundation is in place. More functionality is coming soon.</p>
      </article>
    </>
  )
}
