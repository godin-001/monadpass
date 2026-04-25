// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CommemorativeBadge
/// @notice ERC721 badge minted to attendees who actually checked in to an event.
///         One badge per (attendee, eventId) pair.
contract CommemorativeBadge is ERC721, Ownable {
    uint256 private _nextTokenId = 1;
    string private _base;

    mapping(uint256 => uint256) public eventIdOf;
    mapping(address => mapping(uint256 => bool)) public hasBadge;
    mapping(address => mapping(uint256 => uint256)) public badgeTokenOf;

    event BadgeMinted(address indexed to, uint256 indexed tokenId, uint256 indexed eventId);

    constructor(string memory name_, string memory symbol_, string memory baseURI_)
        ERC721(name_, symbol_)
        Ownable()
    {
        _base = baseURI_;
    }

    /// @notice Mint a commemorative badge to `to` for event `eventId`.
    /// @dev MVP: gated by owner (organizer wallet). After we add a coordinator,
    ///      this should be restricted to the check-in flow that also calls
    ///      EventTicket.markUsed in the same tx.
    function mint(address to, uint256 eventId) external onlyOwner returns (uint256 tokenId) {
        require(!hasBadge[to][eventId], "Badge: already minted");
        tokenId = _nextTokenId++;
        eventIdOf[tokenId] = eventId;
        hasBadge[to][eventId] = true;
        badgeTokenOf[to][eventId] = tokenId;
        _safeMint(to, tokenId);
        emit BadgeMinted(to, tokenId, eventId);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _base = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }
}
