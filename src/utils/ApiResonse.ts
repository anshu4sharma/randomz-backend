class ApiResponse {
  success: boolean;
  constructor(
    public message = "Success",
    public data: any,
    public statusCode: number,
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
