declare interface PaginationResponse<T> {
  count: number;
  next: string | null;
  current_page: number;
  total_pages: number;
  page_size: number;
  previous: string | null;
  results: T[];
}
