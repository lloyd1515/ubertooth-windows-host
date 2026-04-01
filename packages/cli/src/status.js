export function mergeStatusEntries(protocolEntries, runtimeEntries) {
  const runtimeById = new Map(runtimeEntries.map((entry) => [entry.pnpDeviceId, entry]));

  return protocolEntries.map((protocolEntry) => {
    const runtimeEntry = runtimeById.get(protocolEntry.pnpDeviceId);
    return {
      ...protocolEntry,
      runtimeInfo: runtimeEntry?.runtimeInfo ?? null
    };
  });
}
