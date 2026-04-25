export const MONADPASS_CORE_ABI = [
  "function nextEventId() view returns (uint256)",
  "function createEvent(string name,string location,uint64 startTime,uint64 endTime,uint64 maxSupply,uint256 price) returns (uint256)",
  "function buyTicket(uint256 eventId) payable returns (uint256)",
  "function checkIn(uint256 eventId,uint256 tokenId) returns (uint256)",
  "function getEventSummary(uint256 eventId) view returns ((string name,string location,uint64 startTime,uint64 endTime,uint64 maxSupply,uint256 price,address organizer,bool active),(uint64 sold,uint64 checkedIn,uint64 burned,uint256 revenue,uint64 lastSaleAt,uint64 lastCheckInAt))",
] as const;

export const EVENT_TICKET_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function eventIdOf(uint256 tokenId) view returns (uint256)",
  "function used(uint256 tokenId) view returns (bool)",
] as const;
