export const filterAnalyticsByDate = (data: any[], dateRange: any) => {
  const fromTimestamp = dateRange?.from?.getTime();
  const toTimestamp = dateRange?.to?.getTime();
  if (!data) return undefined
  return data.filter((dataPoint) => {
    const dataPointTimestamp = new Date(dataPoint.date)?.getTime();
    return dataPointTimestamp >= fromTimestamp && dataPointTimestamp <= toTimestamp;
  });
}