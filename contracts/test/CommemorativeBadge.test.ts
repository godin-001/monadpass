import { expect } from "chai";
import { ethers } from "hardhat";

describe("CommemorativeBadge", () => {
  it("mints once per (attendee, event)", async () => {
    const [owner, alice] = await ethers.getSigners();

    const Badge = await ethers.getContractFactory("CommemorativeBadge");
    const badge = await Badge.deploy("MonadPass Badge", "MPB", "ipfs://badge/");
    await badge.waitForDeployment();

    await expect(badge.mint(alice.address, 7n))
      .to.emit(badge, "BadgeMinted")
      .withArgs(alice.address, 1n, 7n);

    expect(await badge.ownerOf(1n)).to.equal(alice.address);
    expect(await badge.eventIdOf(1n)).to.equal(7n);
    expect(await badge.hasBadge(alice.address, 7n)).to.equal(true);
    expect(await badge.badgeTokenOf(alice.address, 7n)).to.equal(1n);

    await expect(badge.mint(alice.address, 7n)).to.be.revertedWith("Badge: already minted");
  });
});
