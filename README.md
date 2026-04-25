# MonadPass

NFT-based event ticketing on Monad. Mint tickets as ERC721 NFTs, check attendees in via QR, and reward them with a commemorative badge NFT.

## Structure

```
.
├── app/         # Next.js (App Router, TS) frontend
└── contracts/   # Hardhat (TS) Solidity contracts
```

## Frontend (`app/`)

```bash
cd app
npm install
npm run dev
```

Pages:
- `/` — landing
- `/events/[id]` — event detail / ticket purchase placeholder
- `/checkin/[id]` — organizer check-in placeholder

## Contracts (`contracts/`)

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

Contracts:
- `EventTicket.sol` — ERC721 ticket NFT (mint, markUsed, burnUsedTicket, baseURI)
- `CommemorativeBadge.sol` — ERC721 badge NFT issued to checked-in attendees
- `MonadPassCore.sol` — creates events, sells tickets, executes check-in, burns used tickets, mints commemorative NFTs, and stores timestamp analytics

Core MVP flow:
- organizer creates event and ticket supply
- attendee buys ticket on-chain
- organizer checks attendee in
- checked-in ticket is burned
- attendee receives commemorative NFT badge
- event analytics track sold/check-in/burn counts plus last sale/check-in timestamps

## TODO

- Wire wallet (RainbowKit/wagmi) into the frontend
- QR generation for tickets + scan flow for organizer check-in
- Monad testnet RPC config in Hardhat + frontend
- Deploy script and contract address wiring
