export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="route-curtain" aria-hidden="true">
        <span>HASS Studio.</span>
      </div>
      {children}
    </>
  );
}
