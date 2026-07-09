import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { StepFlowDemo } from './step-flow-demo';
import { StepFlowChart } from './step-flow-chart';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    StepFlowDemo,
    StepFlowChart,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
