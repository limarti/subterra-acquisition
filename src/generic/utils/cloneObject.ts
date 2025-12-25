export function cloneObject(src: any)
{
  if (src === undefined)
    return undefined;
  else
    return JSON.parse(JSON.stringify(src));
}
