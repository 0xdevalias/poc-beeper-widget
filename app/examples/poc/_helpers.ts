import { RoomEvent } from "@beeper/matrix-widget-toolkit-api";

export type BucketedRoomEvent = {
  id: string;
  name: string;
  sender: string;
  roomEvent: RoomEvent<any>;
};

export type BucketedByDomainAndSender<T = BucketedRoomEvent> = {
  [matrixServer: string]: {
    [senderKey: string]: T[];
  };
};

export const groupEventsByDomainAndSenderReducer = (
  acc: BucketedByDomainAndSender,
  roomEvent: RoomEvent<any>,
) => {
  // Extract the top-level domain after the colon
  const topLevelDomainMatch = roomEvent.sender.match(/:([^:]+)$/);
  const topLevelDomain = topLevelDomainMatch
    ? topLevelDomainMatch[1]
    : "_unknown";

  // Initialize the top-level domain bucket if it doesn't exist
  if (!acc[topLevelDomain]) {
    acc[topLevelDomain] = {};
  }

  // Extract the sender key between @ and :, up to an underscore if present
  const senderKeyMatch = roomEvent.sender.match(/@([^:_]+)/);
  const senderKey = senderKeyMatch ? senderKeyMatch[1] : "_unknown";

  // Initialize the sender key bucket if it doesn't exist within the top-level domain
  if (!acc[topLevelDomain][senderKey]) {
    acc[topLevelDomain][senderKey] = [];
  }

  // Push the current name and sender into the appropriate nested bucket
  acc[topLevelDomain][senderKey].push({
    id: roomEvent.room_id,
    name: roomEvent.content.name,
    sender: roomEvent.sender,
    roomEvent,
  });

  return acc;
};

const emptyDomainSenderNameMapping: BucketedByDomainAndSender<string> =
  Object.freeze({});
export const mapBucketedRoomEventsToRoomNames = (
  bucketedRoomEvents: BucketedByDomainAndSender,
): BucketedByDomainAndSender<string> => {
  if (!bucketedRoomEvents) return emptyDomainSenderNameMapping;

  const domainSenderNameMapping: BucketedByDomainAndSender<string> = {};

  Object.keys(bucketedRoomEvents).forEach((domain) => {
    domainSenderNameMapping[domain] = domainSenderNameMapping[domain] || {};

    Object.keys(bucketedRoomEvents[domain]).forEach((sender) => {
      domainSenderNameMapping[domain][sender] = bucketedRoomEvents[domain][
        sender
      ].map((event) => event.name);
    });
  });

  return domainSenderNameMapping;
};
