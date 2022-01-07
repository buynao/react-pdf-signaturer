export const getCanvasStandPosition = (e: any) => {
  const rect = e.target.getBoundingClientRect();
  const x = e.pageX - rect.left;
  const y = e.pageY - rect.top;
  return {
    x: x,
    y: y
  }
}