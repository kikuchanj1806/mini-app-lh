export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface IResQuestionSet {
  id: number;
  wardId: number;
  name: string;
  image?: string | null;
  status: number;
}

export interface IResQuestion {
  id: number;
  wardId: number;
  content: string;
  options: Record<OptionKey, string | null>;
  correct_option: OptionKey;
  status: number;
  questionSet?: { id: number; name: string } | null;
}

export interface IResponseApiM<T> {
  status: string;
  data: T;
  meta?: {
    total?: number;
    currentPage?: number;
    perPage?: number;
  };
  message?: string;
}
