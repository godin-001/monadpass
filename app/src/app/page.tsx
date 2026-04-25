import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>MonadPass</h1>
      <p className="muted">
        NFT-based event ticketing on Monad. Tickets are ERC721 — check in with a QR
        scan and get a commemorative badge as proof of attendance.
      </p>

      <div className="card">
        <h2>Flujo MVP</h2>
        <ol>
          <li>Creador define evento, supply y precio</li>
          <li>Usuario compra boleto on-chain</li>
          <li>Organizer hace check-in</li>
          <li>Se quema el ticket usado</li>
          <li>Se mintea NFT conmemorativo</li>
          <li>Se guardan timestamps y métricas de uso</li>
        </ol>
      </div>

      <div className="card">
        <h2>Rutas activas</h2>
        <p className="muted">Primero crea un evento. Luego usa su ID para compra y check-in.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn" href="/organizer/new">Crear evento</Link>
          <Link className="btn" href="/events/1">Comprar ticket</Link>
          <Link className="btn" href="/checkin/1">Panel de check-in</Link>
        </div>
      </div>

      {/* TODO: wallet connect button (RainbowKit / wagmi) goes here */}
    </main>
  );
}
