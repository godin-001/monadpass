// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title EventTicket
/// @notice ERC721 ticket NFT for a single MonadPass event series.
///         Tickets can be minted by the organizer, marked as used at check-in,
///         and burned after use. The badge contract is expected to be the
///         designated check-in caller, but for MVP we let the owner do both.
contract EventTicket is ERC721, ERC721Burnable, Ownable {
    uint256 private _nextTokenId = 1;
    string private _base;

    mapping(uint256 => bool) public used;
    mapping(uint256 => uint256) public eventIdOf;

    event TicketMinted(address indexed to, uint256 indexed tokenId, uint256 indexed eventId);
    event TicketMarkedUsed(uint256 indexed tokenId);
    event TicketBurned(uint256 indexed tokenId);

    constructor(string memory name_, string memory symbol_, string memory baseURI_)
        ERC721(name_, symbol_)
        Ownable()
    {
        _base = baseURI_;
    }

    /// @notice Mint a new ticket to `to` for event `eventId`.
    function mint(address to, uint256 eventId) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        eventIdOf[tokenId] = eventId;
        _safeMint(to, tokenId);
        emit TicketMinted(to, tokenId, eventId);
    }

    /// @notice Mark a ticket as used (called at check-in).
    /// @dev Does not burn — ticket remains in wallet as proof of attendance
    ///      until/unless the organizer also burns it.
    function markUsed(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "EventTicket: nonexistent");
        require(!used[tokenId], "EventTicket: already used");
        used[tokenId] = true;
        emit TicketMarkedUsed(tokenId);
    }

    /// @notice Burn a ticket that has already been marked used.
    /// @dev Useful when organizer wants to fully retire the ticket post-event.
    function burnUsedTicket(uint256 tokenId) external onlyOwner {
        require(used[tokenId], "EventTicket: not used yet");
        _burn(tokenId);
        emit TicketBurned(tokenId);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _base = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }
}
