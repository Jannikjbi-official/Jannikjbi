import assert from "node:assert/strict";
import { test } from "node:test";

import { mapChannel, mapSponsor, mapStream } from "../src/server/notion/map";
import type { NotionPage } from "../src/server/notion/client";

/**
 * These fixtures mirror the real "Creator Buddy Dashboard 1.1.1" schema:
 * Kanäle (Name, Plattform, URL), Content DB (Name, Typ, Status, Idee,
 * Veröffentlichungsdatum, URL, Kanal) and Sponsoren (Sponsor).
 */

const page = (id: string, properties: NotionPage["properties"]): NotionPage => ({
  id,
  properties,
});

const title = (text: string) => ({ type: "title", title: [{ plain_text: text }] });
const select = (name: string) => ({ type: "select", select: { name } });
const url = (value: string) => ({ type: "url", url: value });
const checkbox = (value: boolean) => ({ type: "checkbox", checkbox: value });
const date = (start: string) => ({ type: "date", date: { start } });
const relation = (ids: string[]) => ({ type: "relation", relation: ids.map((id) => ({ id })) });

/* -------------------------------------------------------------------------- */

test("mapChannel maps a Twitch channel and derives the handle", () => {
  const result = mapChannel(
    page("2b45fc21467e833c8e46017e68b403ce", {
      Name: title("Jannikjbi"),
      Plattform: select("Twitch"),
      URL: url("https://twitch.tv/Jannikjbi"),
    }),
  );

  assert.ok(result);
  assert.equal(result.platform, "twitch");
  assert.equal(result.label, "Jannikjbi");
  assert.equal(result.handle, "Jannikjbi");
  assert.equal(result.notionId, "2b45fc21467e833c8e46017e68b403ce");
});

test("mapChannel strips the @ from a YouTube handle", () => {
  const result = mapChannel(
    page("c9d5fc21467e8347b2c78173dab10652", {
      Name: title("Jannikjbi"),
      Plattform: select("YouTube"),
      URL: url("https://www.youtube.com/@Jannikjbi"),
    }),
  );

  assert.equal(result?.platform, "youtube");
  assert.equal(result?.handle, "Jannikjbi");
});

test("mapChannel maps every Creator Buddy platform to a known social platform", () => {
  const cases: Array<[string, string]> = [
    ["Twitch", "twitch"],
    ["YouTube", "youtube"],
    ["TikTok", "tiktok"],
    ["Instagram", "instagram"],
    ["Kick", "kick"],
    ["Facebook", "facebook"],
    ["X (Twitter)", "x"],
    ["Website", "website"],
    ["Newsletter", "website"],
  ];

  for (const [notionPlatform, expected] of cases) {
    const result = mapChannel(
      page("a".repeat(32), {
        Name: title("Kanal"),
        Plattform: select(notionPlatform),
        URL: url("https://example.com/x"),
      }),
    );

    assert.equal(result?.platform, expected, `${notionPlatform} should map to ${expected}`);
  }
});

test("mapChannel skips a row without a usable URL", () => {
  assert.equal(
    mapChannel(page("b".repeat(32), { Name: title("Ohne Link"), Plattform: select("Twitch") })),
    null,
  );
});

/* -------------------------------------------------------------------------- */

const channelPlatforms = new Map<string, string | null>([
  ["c9d5fc21467e8347b2c78173dab10652", "YouTube"],
  ["2b45fc21467e833c8e46017e68b403ce", "Twitch"],
]);

test("mapStream skips the real 'Transport Fever 3' row, which has no publish date", () => {
  const result = mapStream(
    page("3e35fc21467e80e792bef9d4356486b2", {
      Name: title("Transport Fever 3"),
      Typ: select("Stream"),
      Status: select("Geplant"),
      Idee: checkbox(true),
      Kanal: relation(["c9d5fc21467e8347b2c78173dab10652"]),
    }),
    channelPlatforms,
  );

  assert.ok("skipped" in result);
  assert.equal(result.skipped.title, "Transport Fever 3");
  assert.match(result.skipped.reason, /Veröffentlichungsdatum/);
});

test("mapStream maps a dated stream and takes its platform from the linked channel", () => {
  const result = mapStream(
    page("d".repeat(32), {
      Name: title("Transport Fever 3 – Release Stream"),
      Typ: select("Stream"),
      Status: select("Geplant"),
      Idee: checkbox(false),
      "Veröffentlichungsdatum": date("2026-04-12T20:30:00.000+02:00"),
      URL: url("https://twitch.tv/jannikjbi"),
      Kanal: relation(["2b45fc21467e833c8e46017e68b403ce"]),
    }),
    channelPlatforms,
  );

  assert.ok("stream" in result);
  assert.equal(result.stream.title, "Transport Fever 3 – Release Stream");
  assert.equal(result.stream.platform, "twitch");
  assert.equal(result.stream.startTime, "20:30");
  assert.equal(result.stream.date.toISOString(), "2026-04-12T00:00:00.000Z");
  assert.equal(result.stream.active, true);
  assert.equal(result.stream.link, "https://twitch.tv/jannikjbi");
});

test("mapStream defaults a date-only entry to 19:00 rather than inventing a time", () => {
  const result = mapStream(
    page("e".repeat(32), {
      Name: title("Aufbau-Abend"),
      Typ: select("Stream"),
      Status: select("Geplant"),
      "Veröffentlichungsdatum": date("2026-05-02"),
    }),
    channelPlatforms,
  );

  assert.ok("stream" in result);
  assert.equal(result.stream.startTime, "19:00");
});

test("mapStream keeps an idea off the public schedule", () => {
  const result = mapStream(
    page("f".repeat(32), {
      Name: title("Nur eine Idee"),
      Typ: select("Stream"),
      Status: select("Geplant"),
      Idee: checkbox(true),
      "Veröffentlichungsdatum": date("2026-05-02"),
    }),
    channelPlatforms,
  );

  assert.ok("stream" in result);
  assert.equal(result.stream.active, false);
});

test("mapStream keeps a stream on hold off the public schedule", () => {
  const result = mapStream(
    page("0".repeat(32), {
      Name: title("Verschoben"),
      Typ: select("Stream"),
      Status: select("In Wartestellung"),
      "Veröffentlichungsdatum": date("2026-05-02"),
    }),
    channelPlatforms,
  );

  assert.ok("stream" in result);
  assert.equal(result.stream.active, false);
});

test("mapStream ignores content that is not a stream", () => {
  const result = mapStream(
    page("1".repeat(32), {
      Name: title("Ein YouTube-Video"),
      Typ: select("Video"),
      "Veröffentlichungsdatum": date("2026-05-02"),
    }),
    channelPlatforms,
  );

  assert.ok("skipped" in result);
  assert.match(result.skipped.reason, /nicht "Stream"/);
});

/* -------------------------------------------------------------------------- */

test("mapSponsor builds a slug from the sponsor name", () => {
  const result = mapSponsor(page("2".repeat(32), { Sponsor: title("Instant Gaming") }));

  assert.equal(result?.name, "Instant Gaming");
  assert.equal(result?.slug, "instant-gaming");
});

test("mapSponsor skips a nameless row", () => {
  assert.equal(mapSponsor(page("3".repeat(32), { Sponsor: title("") })), null);
});
