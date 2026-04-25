"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatEther } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import { getConnectedAddress, getReadBadgeContract, getReadCoreContract, getWriteCoreContract } from "@/lib/web3";

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
  const [account, setAccount] = useState("");
  const [ownedTicketId, setOwnedTicketId] = useState("");
  const [badgeTokenId, setBadgeTokenId] = useState("");

  const qrPayload = useMemo(() => {
    if (!ownedTicketId || !account) return "";
    return JSON.stringify({
      eventId: Number(id),
      tokenId: Number(ownedTicketId),
      owner: account,
    });
  }, [id, ownedTicketId, account]);

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
      setStatus("");
    } catch {
      setSummary(null);
      setStatus(`No pude leer el evento #${id}.`);
    }
  }

  async function loadOwnedAssets() {
    try {
      const connected = await getConnectedAddress();
      setAccount(connected);

      const cachedTicket = window.localStorage.getItem(`monadpass:event:${id}:ticket:${connected}`);
      if (cachedTicket) setOwnedTicketId(cachedTicket);

      const badge = getReadBadgeContract();
      const hasBadge = await badge.hasBadge(connected, id);
      if (hasBadge) {
        const token = await badge.badgeTokenOf(connected, id);
        setBadgeTokenId(token.toString());
      } else {
        setBadgeTokenId("");
      }
    } catch {
      // Wallet not connected yet.
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
      const receipt = await tx.wait();

      const purchaseLog = receipt?.logs
        .map((log: unknown) => {
          try {
            return core.interface.parseLog(log as { topics: readonly string[]; data: string });
          } catch {
            return null;
          }
        })
        .find((log: { name?: string } | null) => log?.name === "TicketPurchased");

      const tokenId = purchaseLog?.args?.tokenId?.toString?.() ?? "";
      const buyer = purchaseLog?.args?.buyer?.toString?.() ?? "";

      if (tokenId && buyer) {
        window.localStorage.setItem(`monadpass:event:${id}:ticket:${buyer}`, tokenId);
        setOwnedTicketId(tokenId);
        setAccount(buyer);
      }

      setStatus(tokenId ? `Ticket #${tokenId} comprado con éxito.` : "Ticket comprado con éxito.");
      await loadEvent();
      await loadOwnedAssets();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pude comprar el ticket";
      setStatus(message);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    loadEvent();
    loadOwnedAssets();
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
            <h2>Mi ticket</h2>
            {ownedTicketId ? (
              <>
                <p><strong>Token ID:</strong> #{ownedTicketId}</p>
                <p className="muted">Este QR codifica eventId + tokenId + owner para el check-in.</p>
                <QRCodeSVG value={qrPayload} size={180} bgColor="#15151f" fgColor="#f4f4f5" />
                <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{qrPayload}</pre>
              </>
            ) : (
              <p className="muted">Compra un ticket y aquí te muestro el QR.</p>
            )}
          </div>

          <div className="card">
            <h2>Badge conmemorativo</h2>
            {badgeTokenId ? (
              <p><strong>Ya lo tienes:</strong> badge #{badgeTokenId}</p>
            ) : (
              <p className="muted">Aparece aquí después del check-in.</p>
            )}
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
