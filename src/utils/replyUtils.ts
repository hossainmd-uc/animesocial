import type { ServerPost } from '../types/server';

export interface NestedReply extends ServerPost {
  children: NestedReply[];
  depth: number;
}

/**
 * Convert a flat list of replies into a nested structure
 */
export function buildReplyTree(replies: ServerPost[], parentId: string, depth = 0): NestedReply[] {
  const tree: NestedReply[] = [];
  
  // Find direct children of the current parent
  const directChildren = replies.filter(reply => reply.parent_id === parentId);
  
  for (const child of directChildren) {
    const nestedChild: NestedReply = {
      ...child,
      children: buildReplyTree(replies, child.id, depth + 1),
      depth
    };
    tree.push(nestedChild);
  }
  
  // Sort by creation date (oldest first for traditional threading)
  return tree.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/**
 * Get all replies organized in a nested structure for a given post
 */
export function organizeReplies(replies: ServerPost[], rootPostId: string): NestedReply[] {
  return buildReplyTree(replies, rootPostId, 0);
} 