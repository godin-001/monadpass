"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import { getReadCoreContract, getWriteCoreContract } from "@/lib/web3";

type Props = { params: { id: string } };

type EventSummary = {
  name: string;
  location: string;
  startTime: bigint;
  endTime: bigint;
  maxSupply: bigint;
  price: bigint;
  organizer: string;
  active: boolean;
  sold: bigint;
  checkedIn: bigint;
  burned: bigint;
  revenue: bigint;
  lastSaleAt: bigint;
  lastCheckInAt: bigint;
};

function fmtTs(value: bigint) {
  if (value === 0n) return "Pendiente";
  return new Date(Number(value) * 1000).toLocaleString();
}

export default function EventDetailPage({ params }: Props) {
  const { id } = params;
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function loadEvent() {
    try {
      const core = getReadCoreContract();
      const [cfg, stats] = await core.getEventSummary(id);
      if (!cfg.active) {
        setSummary(null);
        setStatus(`El evento #${id} todavía no existe.`);
        return;
      }
      setSummary({
        ...cfg,
        ...stats,
      });
      setStatus("");
    } catch {
      setSummary(null);
      setStatus(`No pude leer el evento #${id}.`);
    }
  }

  async function buyTicket() {
    setPending(true);
    setStatus("Preparando compra...");
    try {
      const core = await getWriteCoreContract();
      const price = summary?.price ?? 0n;
      const tx = await core.buyTicket(id, { value: price });
      setStatus(`Compra enviada: ${tx.hash}`);
      await tx.wait();
      setStatus("Ticket comprado con éxito.");
      await loadEvent();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pude comprar el ticket";
      setStatus(message);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [id]);

  return (
    <main>
      <Link href="/">&larr; Back</Link>
      <h1>Evento #{id}</h1>
      <p className="muted">Compra de ticket contra MonadPassCore.buyTicket(eventId).</p>

      {!summary ? (
        <div className="card"><p>{status || "Cargando..."}</p></div>
      ) : (
        <>
          <div className="card">
            <h2>{summary.name}</h2>
            <p>{summary.location}</p>
            <ul>
              <li>Inicio: {fmtTs(summary.startTime)}</li>
              <li>Fin: {fmtTs(summary.endTime)}</li>
              <li>Precio: {formatEther(summary.price)} ETH</li>
              <li>Supply: {summary.maxSupply.toString()}</li>
              <li>Vendidos: {summary.sold.toString()}</li>
              <li>Disponibles: {(summary.maxSupply - summary.sold).toString()}</li>
            </ul>
            <button className="btn" disabled={pending} onClick={buyTicket}>
              {pending ? "Comprando..." : "Comprar ticket"}
            </button>
          </div>

          <div className="card">
            <h2>Analítica</h2>
            <ul>
              <li>Revenue: {formatEther(summary.revenue)} ETH</li>
              <li>Check-ins: {summary.checkedIn.toString()}</li>
              <li>Burned: {summary.burned.toString()}</li>
              <li>Última venta: {fmtTs(summary.lastSaleAt)}</li>
              <li>Último check-in: {fmtTs(summary.lastCheckInAt)}</li>
            </ul>
          </div>
        </>
      )}

      {status && summary ? <div className="card"><p>{status}</p></div> : null}
    </main>
  );
}
