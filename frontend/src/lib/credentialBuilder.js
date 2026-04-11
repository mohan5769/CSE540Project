export function buildAttendanceCredential({
  sessionId,
  holderAddress,
  holderDID,
  issuerAddress,
  issuerDID,
  sessionTitle,
  sessionDescription,
  eventType,
  dateAttended,
}) {
  return {
    type: "AttendanceCredential",
    sessionId: String(sessionId),
    holderAddress,
    holderDID,
    issuerAddress,
    issuerDID,
    sessionTitle,
    sessionDescription,
    eventType,
    dateAttended,
    issuedAt: new Date().toISOString(),
  };
}
