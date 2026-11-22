import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { TraceVariable } from '../../../core/playground/types';

interface VariableInspectorProps {
  variables: TraceVariable[];
}

function VariableRow({ variable, depth }: { variable: TraceVariable; depth: number }) {
  const [expanded, setExpanded] = useState(depth === 0 && (variable.children?.length ?? 0) > 0);
  const hasChildren = (variable.children?.length ?? 0) > 0;

  return (
    <Box style={{ paddingLeft: depth * 12 }}>
      <Flex
        gap={SPACING.xs}
        align="center"
        onClick={() => hasChildren && setExpanded((prev) => !prev)}
        style={{ cursor: hasChildren ? 'pointer' : 'default' } as React.CSSProperties}
      >
        <span style={{ width: 10, color: COLORS.textMuted, fontSize: '0.7rem' }}>
          {hasChildren ? (expanded ? '▾' : '▸') : ''}
        </span>
        <Text as="span" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
          {variable.name}
        </Text>
        <Text as="span" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, fontSize: '0.7rem' }}>
          {variable.type}
        </Text>
        <Text
          as="span"
          style={{
            ...TYPOGRAPHY.small,
            color: COLORS.accent,
            margin: 0,
            fontFamily: '"SF Mono", Menlo, monospace',
            fontSize: '0.73rem',
            wordBreak: 'break-all',
          }}
        >
          {variable.unavailable ? 'unavailable' : variable.value}
        </Text>
      </Flex>

      {expanded && hasChildren && (
        <Box style={{ marginTop: 2 }}>
          {variable.children!.map((child, index) => (
            <VariableRow key={`${child.name}-${index}`} variable={child} depth={depth + 1} />
          ))}
        </Box>
      )}
    </Box>
  );
}

/**
 * Shows the variables of the current stack frame as reported by the debugger.
 */
export const VariableInspector: FunctionComponent<VariableInspectorProps> = ({ variables }) => {
  if (variables.length === 0) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
        No variables to show. Start the debugger and step into the program.
      </Text>
    );
  }

  return (
    <Box
      style={{
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        display: 'grid',
        gap: 4,
      }}
    >
      {variables.map((variable, index) => (
        <VariableRow key={`${variable.name}-${index}`} variable={variable} depth={0} />
      ))}
    </Box>
  );
};
