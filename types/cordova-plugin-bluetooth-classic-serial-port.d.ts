declare global
{
  interface BluetoothClassicSerialPort
  {
    connect(
      deviceId: string,
      interfaceIdArray: string[],
      successCallback: () => void,
      failureCallback: (error: string) => void
    ): void;

    connectInsecure(
      deviceId: string,
      interfaceIdArray: string[],
      successCallback: () => void,
      failureCallback: (error: string) => void
    ): void;

    disconnect(
      deviceId: string,
      interfaceId: string,
      successCallback?: () => void,
      failureCallback?: (error: string) => void
    ): void;

    disconnectAll(
      successCallback?: () => void,
      failureCallback?: (error: string) => void
    ): void;

    isConnected(
      deviceId: string,
      interfaceId: string,
      successCallback: () => void,
      failureCallback: (error: string) => void
    ): void;

    write(
      deviceId: string,
      interfaceId: string,
      data: ArrayBuffer | Uint8Array | string | number[],
      successCallback?: () => void,
      failureCallback?: (error: string) => void
    ): void;

    read(
      deviceId: string,
      interfaceId: string,
      successCallback: (data: string) => void,
      failureCallback: (error: string) => void
    ): void;

    readUntil(
      deviceId: string,
      interfaceId: string,
      delimiter: string,
      successCallback: (data: string) => void,
      failureCallback: (error: string) => void
    ): void;

    available(
      deviceId: string,
      interfaceId: string,
      successCallback: (count: number) => void,
      failureCallback: (error: string) => void
    ): void;

    clear(
      deviceId: string,
      interfaceId: string,
      successCallback?: () => void,
      failureCallback?: (error: string) => void
    ): void;

    subscribe(
      deviceId: string,
      interfaceId: string,
      delimiter: string,
      successCallback: (data: string) => void,
      failureCallback: (error: string) => void
    ): void;

    unsubscribe(
      deviceId: string,
      interfaceId: string,
      successCallback?: () => void,
      failureCallback?: (error: string) => void
    ): void;

    subscribeRawData(
      deviceId: string,
      interfaceId: string,
      successCallback: (data: ArrayBuffer) => void,
      failureCallback: (error: string) => void
    ): void;

    unsubscribeRawData(
      deviceId: string,
      interfaceId: string,
      successCallback?: () => void,
      failureCallback?: (error: string) => void
    ): void;

    list(
      successCallback: (devices: BluetoothClassicDevice[]) => void,
      failureCallback: (error: string) => void
    ): void;

    discoverUnpaired(
      successCallback: (devices: BluetoothClassicDevice[]) => void,
      failureCallback: (error: string) => void
    ): void;

    setDeviceDiscoveredListener(
      notifyCallback: (device: BluetoothClassicDevice) => void
    ): void;

    clearDeviceDiscoveredListener(): void;

    isEnabled(
      successCallback: () => void,
      failureCallback: (error: string) => void
    ): void;

    enable(
      successCallback: () => void,
      failureCallback: (error: string) => void
    ): void;

    showBluetoothSettings(
      successCallback?: () => void,
      failureCallback?: (error: string) => void
    ): void;
  }

  interface BluetoothClassicDevice
  {
    id: string;
    name?: string;
    address: string;
    class?: number;
  }

  const bluetoothClassicSerial: BluetoothClassicSerialPort;
}

export {};
