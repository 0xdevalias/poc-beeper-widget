"use client";

import { useEffect, useMemo, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";

import { Symbols } from "@beeper/matrix-widget-api";
import { RoomEvent } from "@beeper/matrix-widget-toolkit-api";
import { useWidgetApi } from "@beeper/matrix-widget-toolkit-react";

import Back from "@/app/components/back";
import {
  BucketedByDomainAndSender,
  groupEventsByDomainAndSenderReducer,
  mapBucketedRoomEventsToRoomNames,
} from "@/app/examples/poc/_helpers";

// TODO: Refactor this so that once we have loaded the room names/etc once, we use the 'since' parameter to only load new events
// TODO: Save the room names/etc + 'since' key to localStorage so that we don't have to fetch them from scratch each time
// TODO: Refactor this to move the room name/message loading/watching logic outside of the component (redux+redux-saga or similar?)
// TODO: Explore whether a new widget instance is created for each room the widget is opened in.. and if so, if they have any way to communicate with each other
export default function PoC() {
  const widgetApi = useWidgetApi();

  const [roomNamesData, setRoomNamesData] = useState<RoomEvent<any>[]>([]);

  useEffect(() => {
    // (window as any).roomEvents = [];

    const roomNamesSubscription = widgetApi
      .observeStateEvents("m.room.name", { roomIds: Symbols.AnyRoom })
      .subscribe((event) => {
        // console.log("PoC::roomNamesSubscription::event:", event);
        // (window as any).roomEvents.push(event);

        setRoomNamesData((prevRoomNamesData) => [...prevRoomNamesData, event]);
      });

    return () => {
      roomNamesSubscription.unsubscribe();

      // This is to ensure we don't end up with duplicates when we re-subscribe
      setRoomNamesData([]);
    };
  }, [widgetApi]);

  const bucketedRoomNamesData = useMemo(
    () => roomNamesData.reduce(groupEventsByDomainAndSenderReducer, {}),
    [roomNamesData],
  );

  const bucketedRoomNames = useMemo(
    () => mapBucketedRoomEventsToRoomNames(bucketedRoomNamesData),
    [bucketedRoomNamesData],
  );

  const facebookRoomNames =
    bucketedRoomNames["beeper.local"]?.["facebook"] ?? [];

  const allRoomNames = useMemo(
    () => roomNamesData.map((roomName) => roomName.content.name),
    [roomNamesData],
  );

  const bucketRoomNameSenderDomains = Object.keys(
    bucketedRoomNamesData || {},
  ).sort();

  const beeperLocalRoomSenders = Object.keys(
    bucketedRoomNamesData["beeper.local"] || {},
  )
    .sort()
    .map((sender) => ({
      sender,
      count: bucketedRoomNamesData["beeper.local"][sender].length,
    }));

  return (
    <>
      <Back />

      <div>
        <p>
          TODO: Figure out when the last message was sent (and who sent it) for
          all of the chats we know about
        </p>
        <div>
          bucketedRoomNamesData (keys):
          <SyntaxHighlighter language="json" className="mt-4">
            {JSON.stringify(bucketRoomNameSenderDomains, null, 2)}
          </SyntaxHighlighter>
        </div>
        <div>
          {"bucketedRoomNamesData['beeper.local'] (keys and counts):"}
          <SyntaxHighlighter language="json" className="mt-4">
            {JSON.stringify(beeperLocalRoomSenders, null, 2)}
          </SyntaxHighlighter>
        </div>
        <div>
          roomNamesData ({roomNamesData.length}), showing top 5:
          <SyntaxHighlighter language="json" className="mt-4">
            {JSON.stringify(roomNamesData.slice(0, 5), null, 2)}
          </SyntaxHighlighter>
        </div>
        <div>
          facebookRoomNames ({facebookRoomNames.length}), top 5:
          <SyntaxHighlighter language="json" className="mt-4">
            {JSON.stringify(facebookRoomNames.slice(0, 5), null, 2)}
          </SyntaxHighlighter>
        </div>
        <div>
          allRoomNames ({allRoomNames.length}):
          <SyntaxHighlighter language="json" className="mt-4">
            {JSON.stringify(allRoomNames, null, 2)}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
}
