declare module 'html-docx-js' {
  const api: {
    asBlob: (html: string) => Blob | Promise<Blob>;
    asArrayBuffer?: (html: string) => ArrayBuffer | Promise<ArrayBuffer>;
  };
  export = api;
}
