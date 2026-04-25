import { expect } from "chai";
import { ethers } from "hardhat";

describe("EventTicket", () => {
  it("mints, marks used, and burns", async () => {
    const [owner, alice] = await ethers.getSigners();

    const Ticket = await ethers.getContractFactory("EventTicket");
    const ticket = await Ticket.deploy("MonadPass Ticket", "MPT", "ipfs://base/");
    await ticket.waitForDeployment();

    await expect(ticket.mint(alice.address, 1n))
      .to.emit(ticket, "TicketMinted")
      .withArgs(alice.address, 1n, 1n);

    expect(await ticket.ownerOf(1n)).to.equal(alice.address);
    expect(await ticket.eventIdOf(1n)).to.equal(1n);
    expect(await ticket.tokenURI(1n)).to.equal("ipfs://base/1");

    await expect(ticket.markUsed(1n)).to.emit(ticket, "TicketMarkedUsed").withArgs(1n);
    expect(await ticket.used(1n)).to.equal(true);

    await expect(ticket.markUsed(1n)).to.be.revertedWith("EventTicket: already used");

    await expect(ticket.burnUsedTicket(1n)).to.emit(ticket, "TicketBurned").withArgs(1n);
    await expect(ticket.ownerOf(1n)).to.be.reverted;
  });

  it("rejects burnUsedTicket if not yet used", async () => {
    const [owner, alice] = await ethers.getSigners();
    const Ticket = await ethers.getContractFactory("EventTicket");
    const ticket = await Ticket.deploy("MonadPass Ticket", "MPT", "ipfs://base/");
    await ticket.mint(alice.address, 42n);
    await expect(ticket.burnUsedTicket(1n)).to.be.revertedWith("EventTicket: not used yet");
  });
});
