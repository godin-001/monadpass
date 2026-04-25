// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EventTicket} from "./EventTicket.sol";
import {CommemorativeBadge} from "./CommemorativeBadge.sol";

/// @title MonadPassCore
/// @notice Coordinates event creation, ticket sales, check-in, burn, badge mint,
///         and basic on-chain analytics for the MonadPass MVP.
contract MonadPassCore is Ownable {
    struct EventConfig {
        string name;
        string location;
        uint64 startTime;
        uint64 endTime;
        uint64 maxSupply;
        uint256 price;
        address organizer;
        bool active;
    }

    struct EventAnalytics {
        uint64 sold;
        uint64 checkedIn;
        uint64 burned;
        uint256 revenue;
        uint64 lastSaleAt;
        uint64 lastCheckInAt;
    }

    EventTicket public immutable ticket;
    CommemorativeBadge public immutable badge;

    uint256 public nextEventId = 1;

    mapping(uint256 => EventConfig) public eventsById;
    mapping(uint256 => EventAnalytics) public analyticsByEvent;
    mapping(uint256 => uint256) public soldAtByTicket;
    mapping(uint256 => uint256) public checkedInAtByTicket;

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string name,
        uint256 price,
        uint256 maxSupply
    );
    event TicketPurchased(
        uint256 indexed eventId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price,
        uint256 timestamp
    );
    event TicketCheckedIn(
        uint256 indexed eventId,
        uint256 indexed tokenId,
        address indexed attendee,
        uint256 timestamp
    );
    event TicketBurnedAndBadgeMinted(
        uint256 indexed eventId,
        uint256 indexed tokenId,
        uint256 indexed badgeTokenId,
        address attendee
    );

    modifier onlyOrganizer(uint256 eventId) {
        require(eventsById[eventId].organizer == msg.sender, "MonadPass: not organizer");
        _;
    }

    constructor(address ticket_, address badge_) Ownable() {
        ticket = EventTicket(ticket_);
        badge = CommemorativeBadge(badge_);
    }

    function createEvent(
        string calldata name,
        string calldata location,
        uint64 startTime,
        uint64 endTime,
        uint64 maxSupply,
        uint256 price
    ) external returns (uint256 eventId) {
        require(bytes(name).length > 0, "MonadPass: empty name");
        require(startTime < endTime, "MonadPass: invalid time range");
        require(maxSupply > 0, "MonadPass: zero supply");

        eventId = nextEventId++;
        eventsById[eventId] = EventConfig({
            name: name,
            location: location,
            startTime: startTime,
            endTime: endTime,
            maxSupply: maxSupply,
            price: price,
            organizer: msg.sender,
            active: true
        });

        emit EventCreated(eventId, msg.sender, name, price, maxSupply);
    }

    function buyTicket(uint256 eventId) external payable returns (uint256 tokenId) {
        EventConfig memory cfg = eventsById[eventId];
        EventAnalytics storage stats = analyticsByEvent[eventId];

        require(cfg.active, "MonadPass: inactive event");
        require(stats.sold < cfg.maxSupply, "MonadPass: sold out");
        require(msg.value == cfg.price, "MonadPass: wrong price");

        tokenId = ticket.mint(msg.sender, eventId);

        unchecked {
            stats.sold += 1;
        }
        stats.revenue += msg.value;
        stats.lastSaleAt = uint64(block.timestamp);
        soldAtByTicket[tokenId] = block.timestamp;

        emit TicketPurchased(eventId, tokenId, msg.sender, msg.value, block.timestamp);
    }

    function checkIn(uint256 eventId, uint256 tokenId) external onlyOrganizer(eventId) returns (uint256 badgeTokenId) {
        require(ticket.eventIdOf(tokenId) == eventId, "MonadPass: wrong event ticket");
        require(!ticket.used(tokenId), "MonadPass: already checked in");

        address attendee = ticket.ownerOf(tokenId);
        ticket.markUsed(tokenId);
        checkedInAtByTicket[tokenId] = block.timestamp;

        EventAnalytics storage stats = analyticsByEvent[eventId];
        unchecked {
            stats.checkedIn += 1;
        }
        stats.lastCheckInAt = uint64(block.timestamp);

        emit TicketCheckedIn(eventId, tokenId, attendee, block.timestamp);

        ticket.burnUsedTicket(tokenId);
        unchecked {
            stats.burned += 1;
        }

        badgeTokenId = badge.mint(attendee, eventId);
        emit TicketBurnedAndBadgeMinted(eventId, tokenId, badgeTokenId, attendee);
    }

    function withdraw(uint256 eventId) external onlyOrganizer(eventId) {
        uint256 amount = analyticsByEvent[eventId].revenue;
        require(amount > 0, "MonadPass: nothing to withdraw");
        analyticsByEvent[eventId].revenue = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "MonadPass: withdraw failed");
    }

    function getEventSummary(uint256 eventId)
        external
        view
        returns (EventConfig memory cfg, EventAnalytics memory stats)
    {
        cfg = eventsById[eventId];
        stats = analyticsByEvent[eventId];
    }
}
