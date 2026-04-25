import { expect } from "chai";
import { ethers } from "hardhat";

describe("MonadPassCore", () => {
  it("creates event, sells ticket, checks in, burns ticket, and mints badge", async () => {
    const [organizer, attendee] = await ethers.getSigners();

    const Ticket = await ethers.getContractFactory("EventTicket");
    const ticket = await Ticket.deploy("MonadPass Ticket", "MPT", "ipfs://ticket/");
    await ticket.waitForDeployment();

    const Badge = await ethers.getContractFactory("CommemorativeBadge");
    const badge = await Badge.deploy("MonadPass Badge", "MPB", "ipfs://badge/");
    await badge.waitForDeployment();

    const Core = await ethers.getContractFactory("MonadPassCore");
    const core = await Core.deploy(await ticket.getAddress(), await badge.getAddress());
    await core.waitForDeployment();

    await ticket.transferOwnership(await core.getAddress());
    await badge.transferOwnership(await core.getAddress());

    const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
    await expect(
      core.createEvent(
        "Monad Meetup",
        "CDMX",
        now + 3600n,
        now + 7200n,
        100,
        ethers.parseEther("0.1")
      )
    )
      .to.emit(core, "EventCreated")
      .withArgs(1n, organizer.address, "Monad Meetup", ethers.parseEther("0.1"), 100);

    await expect(core.connect(attendee).buyTicket(1n, { value: ethers.parseEther("0.1") }))
      .to.emit(core, "TicketPurchased");

    const [cfgAfterSale, statsAfterSale] = await core.getEventSummary(1n);
    expect(cfgAfterSale.organizer).to.equal(organizer.address);
    expect(statsAfterSale.sold).to.equal(1n);
    expect(statsAfterSale.revenue).to.equal(ethers.parseEther("0.1"));
    expect(await ticket.ownerOf(1n)).to.equal(attendee.address);

    await expect(core.checkIn(1n, 1n))
      .to.emit(core, "TicketCheckedIn")
      .and.to.emit(core, "TicketBurnedAndBadgeMinted");

    const [, statsAfterCheckin] = await core.getEventSummary(1n);
    expect(statsAfterCheckin.checkedIn).to.equal(1n);
    expect(statsAfterCheckin.burned).to.equal(1n);
    expect(await badge.ownerOf(1n)).to.equal(attendee.address);
    await expect(ticket.ownerOf(1n)).to.be.reverted;
    expect(await core.soldAtByTicket(1n)).to.not.equal(0n);
    expect(await core.checkedInAtByTicket(1n)).to.not.equal(0n);
  });
});
