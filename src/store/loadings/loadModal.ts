import { ProgressContext, setProgressModal } from './loadProgress';

interface LoadModalAction {
  caption: string;
  result: any;
  primary?: boolean;
}

export class LoadModal {
  private resolve!: (value: any) => void;

  private reject!: () => void;

  private context!: ProgressContext;

  // eslint-disable-next-line no-useless-constructor, no-empty-function
  constructor(public message: string, public actions: LoadModalAction[]) {}

  activate(progress: ProgressContext): any {
    // Activate the modal.

    setProgressModal(progress, this);
    this.context = progress;

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  answer(result: any) {
    setProgressModal(this.context, undefined);
    this.resolve(result);
  }
}
