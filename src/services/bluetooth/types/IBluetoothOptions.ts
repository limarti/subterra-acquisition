export interface IBluetoothOptions
{
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onData?: (data: Uint8Array) => void;
}
