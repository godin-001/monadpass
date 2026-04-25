"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatEther } from "ethers";
import { getReadCoreContract, getReadTicketContract, getWriteCoreContract } from "@/lib/web3";

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

export default function CheckinPage({ params }: Props) {
  const { id } = params;
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [tokenId, setTokenId] = useState("1");
  const [ownerPreview, setOwnerPreview] = useState("");
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
      setSummary({ ...cfg, ...stats });
    } catch {
      setSummary(null);
      setStatus(`No pude leer el evento #${id}.`);
    }
  }

  async function previewTicket(ticketId: string) {
    if (!ticketId) return;
    try {
      const ticket = getReadTicketContract();
      const owner = await ticket.ownerOf(ticketId);
      const used = await ticket.used(ticketId);
      setOwnerPreview(`${owner}${used ? " · ya usado" : " · válido"}`);
    } catch {
      setOwnerPreview("Ticket no encontrado o ya quemado.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("Enviando check-in...");
    try {
      const core = await getWriteCoreContract();
      const tx = await core.checkIn(id, tokenId);
      setStatus(`Check-in enviado: ${tx.hash}`);
      await tx.wait();
      setStatus(`Check-in completo para ticket #${tokenId}. Ticket quemado + badge minteado.`);
      await loadEvent();
      await previewTicket(tokenId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pude hacer check-in";
      setStatus(message);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    previewTicket(tokenId);
  }, [tokenId]);

  return (
    <main>
      <Link href="/">&larr; Back</Link>
      <h1>Check-in — Evento #{id}</h1>
      <p className="muted">MVP manual: ingresa tokenId o luego sustitúyelo por scanner QR.</p>

      {!summary ? (
        <div className="card"><p>{status || "Cargando..."}</p></div>
      ) : (
        <>
          <div className="card">
            <h2>{summary.name}</h2>
            <ul>
              <li>Ubicación: {summary.location}</li>
              <li>Precio: {formatEther(summary.price)} ETH</li>
              <li>Vendidos: {summary.sold.toString()}</li>
              <li>Check-ins: {summary.checkedIn.toString()}</li>
              <li>Burned: {summary.burned.toString()}</li>
              <li>Última venta: {fmtTs(summary.lastSaleAt)}</li>
              <li>Último check-in: {fmtTs(summary.lastCheckInAt)}</li>
            </ul>
          </div>

          <form className="card" onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <h2>Ejecutar check-in</h2>
            <label>
              Token ID
              <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
            </label>
            <p className="muted">Preview ticket: {ownerPreview || "Cargando..."}</p>
            <button className="btn" disabled={pending}>{pending ? "Procesando..." : "Hacer check-in"}</button>
          </form>
        </>
      )}

      {status && summary ? <div className="card"><p>{status}</p></div> : null}
    </main>
  );
}
