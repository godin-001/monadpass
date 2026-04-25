import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Ticket = await ethers.getContractFactory("EventTicket");
  const ticket = await Ticket.deploy(
    "MonadPass Ticket",
    "MPT",
    "https://monadpass.local/api/ticket/",
  );
  await ticket.waitForDeployment();
  console.log("EventTicket:", await ticket.getAddress());

  const Badge = await ethers.getContractFactory("CommemorativeBadge");
  const badge = await Badge.deploy(
    "MonadPass Badge",
    "MPB",
    "https://monadpass.local/api/badge/",
  );
  await badge.waitForDeployment();
  console.log("CommemorativeBadge:", await badge.getAddress());

  const Core = await ethers.getContractFactory("MonadPassCore");
  const core = await Core.deploy(await ticket.getAddress(), await badge.getAddress());
  await core.waitForDeployment();
  console.log("MonadPassCore:", await core.getAddress());

  await (await ticket.transferOwnership(await core.getAddress())).wait();
  await (await badge.transferOwnership(await core.getAddress())).wait();
  console.log("Transferred EventTicket + CommemorativeBadge ownership to MonadPassCore");

  // TODO: write addresses to app/src/config/contracts.ts so the frontend can read them
  // TODO: seed first event via core.createEvent(...) after Monad testnet config is set
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
