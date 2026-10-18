import type { Course, Unit, Lesson } from "./types";
import GrowthRates from "../visuals/GrowthRates";
import StackQueue from "../visuals/StackQueue";
import TreeTraversal from "../visuals/TreeTraversal";
import HeapViz from "../visuals/HeapViz";
import HashTable from "../visuals/HashTable";
import BSTViz from "../visuals/BSTViz";
import SortViz from "../visuals/SortViz";
import DijkstraViz from "../visuals/DijkstraViz";

/** Builds a unit for one textbook chapter. */
function chapter(n: number, name: string, rest: Omit<Unit, "id" | "label" | "title">): Unit {
  return {
    id: `ch${n}`,
    label: `Ch. ${n}`,
    title: name,
    ...rest,
  };
}

const lessons = (...l: Lesson[]) => l;

export const data: Course = {
  id: "data",
  title: "Data Structures & Algorithms",
  term: "Spring 2026",
  tagline: "Java foundations through trees, hashing, sorting and graphs.",
  hue: 152,
  units: [
    chapter(1, "Java Primer", {
      summary: "Types, classes, control flow and the Java details that trip people up.",
      lessons: lessons(
        { heading: "Values and references", body: "Primitives (int, double, boolean, char) hold values directly. Everything else is an object reached through a reference, so assigning one variable to another copies the reference, not the object." },
        {
          heading: "Packages and access",
          body: "A package groups related classes. public is visible everywhere, private only inside the class, and no modifier means package-private, visible to classes in the same package.",
          checkpoint: {
            prompt: "A field with no access modifier is visible to…",
            options: ["every class", "only its own class", "classes in the same package", "only subclasses"],
            answer: 2,
            explanation: "Leaving the modifier off makes a member package-private.",
          },
        }
      ),
    }),
    chapter(2, "Object-Oriented Design", {
      summary: "Encapsulation, inheritance and polymorphism.",
      lessons: lessons({
        heading: "Inheritance and polymorphism",
        body: "A subclass extends a superclass and may override its methods. A variable's declared type decides which methods you can call; the object's actual type decides which version runs (dynamic dispatch).",
        checkpoint: {
          prompt: "Animal a = new Dog(); a.speak(); runs which speak()?",
          options: ["Animal's", "Dog's", "Neither: it won't compile", "Both"],
          answer: 1,
          explanation: "The object really is a Dog, so Dog's override runs.",
        },
      }),
    }),
    chapter(3, "Fundamental Data Structures", {
      summary: "Arrays and linked lists, and what each operation costs.",
      lessons: lessons({
        heading: "Arrays vs linked lists",
        body: "Arrays give O(1) access by index but O(n) insertion in the middle. Singly linked lists insert at the head in O(1) but need O(n) to reach the i-th node. Doubly linked lists add a back pointer so either end is O(1).",
        checkpoint: {
          prompt: "Removing the last node of a singly linked list with only a head pointer costs…",
          options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
          answer: 2,
          explanation: "You must walk to the second-to-last node to unlink it.",
        },
      }),
    }),
    chapter(4, "Algorithm Analysis", {
      summary: "Counting work as input grows: Big-Oh, Big-Omega and Big-Theta.",
      Visual: GrowthRates,
      visualHint: "Drag n to the right. Toggle curves on and off to compare them, and watch the counts underneath.",
      lessons: lessons(
        {
          heading: "Big-Oh",
          body: "f(n) is O(g(n)) if f eventually stays below c · g(n). Drop constants and lower-order terms: 3n² + 10n + 7 is O(n²). Ω is the matching lower bound and Θ means both.",
          checkpoint: {
            prompt: "5n log n + 2n² + 40 is…",
            options: ["O(n log n)", "O(n²)", "O(n³) only", "O(1)"],
            answer: 1,
            explanation: "n² eventually dominates n log n. (It's also technically O(n³), but O(n²) is the tight bound.)",
          },
        },
        {
          heading: "The common rates",
          body: "From slowest-growing to fastest: 1, log n, n, n log n, n², n³, 2ⁿ. An exponential algorithm overtakes any polynomial once n is large enough.",
        }
      ),
    }),
    chapter(5, "Recursion", {
      summary: "Solving a problem by solving smaller copies of it.",
      lessons: lessons({
        heading: "Base case and progress",
        body: "Every recursive method needs a base case that returns without recursing, and each call must move toward it. Binary search halves the range each time, so it makes O(log n) calls.",
        checkpoint: {
          prompt: "What happens with a recursive method that has no base case?",
          options: ["It returns 0", "Infinite loop with no error", "StackOverflowError", "It won't compile"],
          answer: 2,
          explanation: "Each call adds a stack frame until the call stack runs out.",
        },
      }),
    }),
    chapter(6, "Stacks, Queues, and Deques", {
      summary: "Restricted lists that only let you touch the ends.",
      Visual: StackQueue,
      visualHint: "Switch between the three ADTs and use only the operations each one allows.",
      lessons: lessons(
        {
          heading: "LIFO and FIFO",
          body: "A stack pushes and pops at the top (last in, first out): think undo history or matching brackets. A queue enqueues at the back and dequeues at the front (first in, first out): think print jobs.",
          checkpoint: {
            prompt: "push 1, push 2, pop, push 3, pop, pop returns…",
            options: ["1, 2, 3", "2, 3, 1", "3, 2, 1", "2, 1, 3"],
            answer: 1,
            explanation: "The pop after push 2 gives 2, the next gives 3, and the last gives 1. Try it in the panel.",
          },
        },
        {
          heading: "Deques",
          body: "A double-ended queue supports add and remove at both ends in O(1), so it can act as a stack or a queue. A circular array or a doubly linked list both implement it well.",
        }
      ),
    }),
    chapter(7, "List and Iterator ADTs", {
      summary: "Index-based lists, positional lists, and walking them with iterators.",
      lessons: lessons({
        heading: "Dynamic arrays",
        body: "An ArrayList doubles its capacity when full. One resize copies n items, but spread over the n cheap appends before it, each append costs O(1) amortized.",
        checkpoint: {
          prompt: "Appending n items to a doubling dynamic array costs in total…",
          options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
          answer: 0,
          explanation: "Copies total about n + n/2 + n/4 + … < 2n, so the whole sequence is O(n).",
        },
      }),
    }),
    chapter(8, "Trees", {
      summary: "Hierarchies, binary trees, and the orders you can visit them in.",
      Visual: TreeTraversal,
      visualHint: "Pick a traversal to play it. Numbers show the order each node is visited.",
      lessons: lessons(
        {
          heading: "Vocabulary",
          body: "The root has no parent and leaves have no children. Depth counts edges up to the root, and height is the largest depth. A binary tree of height h has at most 2^(h+1) − 1 nodes.",
          checkpoint: {
            prompt: "Maximum number of nodes in a binary tree of height 3?",
            options: ["7", "8", "15", "16"],
            answer: 2,
            explanation: "1 + 2 + 4 + 8 = 15 = 2⁴ − 1.",
          },
        },
        {
          heading: "Traversals",
          body: "Preorder visits a node before its children, postorder after, and inorder between the left and right subtree. Level order uses a queue to go row by row.",
          checkpoint: {
            prompt: "Which traversal of a binary search tree lists keys in sorted order?",
            options: ["Preorder", "Inorder", "Postorder", "Level order"],
            answer: 1,
            explanation: "Inorder visits everything smaller (left) before the node, then everything larger (right).",
          },
        }
      ),
    }),
    chapter(9, "Priority Queues", {
      summary: "Always serving the smallest key next, using a heap.",
      Visual: HeapViz,
      visualHint: "Insert a value or remove the minimum. Each swap is shown step by step in the tree and the array.",
      lessons: lessons(
        {
          heading: "Heap order",
          body: "In a min-heap every parent is ≤ its children, so the minimum is at the root. The tree is complete, so it fits in an array: node i has children 2i + 1 and 2i + 2.",
          checkpoint: {
            prompt: "In a heap array, where is the parent of index 9?",
            options: ["3", "4", "5", "8"],
            answer: 1,
            explanation: "parent(i) = ⌊(i − 1) / 2⌋ = ⌊8 / 2⌋ = 4.",
          },
        },
        {
          heading: "Up-heap and down-heap",
          body: "insert adds at the end and swaps upward while smaller than its parent. removeMin moves the last element to the root and swaps it down with its smaller child. Both are O(log n).",
        }
      ),
    }),
    chapter(10, "Maps, Hash Tables, and Skip Lists", {
      summary: "Finding a value by its key in expected O(1).",
      Visual: HashTable,
      visualHint: "Insert keys and watch collisions. Switch strategies or change N to see the table rebuilt.",
      lessons: lessons(
        {
          heading: "Hashing",
          body: "A hash function turns a key into a bucket index, such as h(k) = k mod N. When two keys land on the same index they collide. A prime N spreads keys more evenly.",
          checkpoint: {
            prompt: "With N = 7 and linear probing, where does key 15 go if slot 1 is taken?",
            options: ["0", "1", "2", "8"],
            answer: 2,
            explanation: "15 mod 7 = 1 is full, so probing moves on to slot 2.",
          },
        },
        {
          heading: "Load factor",
          body: "λ = n / N. Separate chaining keeps working above 1 but chains grow; open addressing needs λ < 1 and slows sharply near full, so tables resize, typically when λ passes about 0.5–0.75.",
        }
      ),
    }),
    chapter(11, "Search Trees", {
      summary: "Binary search trees and the balanced trees that keep them fast.",
      Visual: BSTViz,
      visualHint: "Type a key, then insert, search or delete it. Highlighted nodes are the comparisons made.",
      lessons: lessons(
        {
          heading: "BST operations",
          body: "Search, insert and delete each follow one root-to-leaf path, so they cost O(h). Deleting a node with two children replaces it with its inorder successor, the smallest key in its right subtree.",
          checkpoint: {
            prompt: "Inserting 1, 2, 3, 4, 5 in order into an empty BST gives height…",
            options: ["2", "3", "4", "5"],
            answer: 2,
            explanation: "Each key goes right of the last, making a chain of 5 nodes with height 4.",
          },
        },
        {
          heading: "Staying balanced",
          body: "AVL and red-black trees rotate after updates so h stays O(log n). Red-black rules: the root and nil leaves are black, no red node has a red child, and every root-to-leaf path has the same number of black nodes.",
        }
      ),
    }),
    chapter(12, "Sorting and Selection", {
      summary: "Putting things in order, and what each strategy costs.",
      Visual: SortViz,
      visualHint: "Choose an algorithm and press Play, or scrub the slider to any step.",
      lessons: lessons(
        {
          heading: "Quadratic sorts",
          body: "Insertion, selection and bubble sort are O(n²) in the worst case. Insertion sort shines on nearly sorted data, dropping to O(n).",
          checkpoint: {
            prompt: "Which sort makes the fewest swaps on a random array?",
            options: ["Bubble", "Insertion", "Selection", "They're all equal"],
            answer: 2,
            explanation: "Selection sort swaps at most once per position, so at most n − 1 swaps.",
          },
        },
        {
          heading: "Divide and conquer",
          body: "Merge sort splits in half, sorts each half and merges in O(n log n), using extra space. Quick sort partitions around a pivot: O(n log n) on average but O(n²) with consistently bad pivots.",
        }
      ),
    }),
    chapter(13, "Text Processing", {
      summary: "Pattern matching, tries and compression.",
      lessons: lessons({
        heading: "Huffman coding",
        body: "Repeatedly merge the two least frequent symbols into one node. Frequent symbols end up near the root with short codes. No code is a prefix of another, so the bit stream decodes without separators.",
        checkpoint: {
          prompt: "Why can Huffman codes be decoded without separators?",
          options: ["Every code is the same length", "No code is a prefix of another", "Codes are sorted", "They use a checksum"],
          answer: 1,
          explanation: "Symbols sit only at leaves, so a code always ends exactly at a leaf.",
        },
      }),
    }),
    chapter(14, "Graph Algorithms", {
      summary: "Traversal, shortest paths and spanning trees.",
      Visual: DijkstraViz,
      visualHint: "Pick a source, then step. Settled vertices turn solid and the shortest-path tree is highlighted.",
      lessons: lessons(
        {
          heading: "Traversal",
          body: "BFS explores in rings using a queue and finds fewest-edge paths. DFS dives deep using a stack or recursion. Both take O(n + m) with adjacency lists.",
        },
        {
          heading: "Dijkstra's algorithm",
          body: "Repeatedly settle the unsettled vertex with the smallest tentative distance, then relax its edges. It needs non-negative weights; with a heap it runs in O((n + m) log n).",
          checkpoint: {
            prompt: "In the panel's graph, what is the shortest distance from A to D?",
            options: ["8", "9", "11", "12"],
            answer: 0,
            explanation: "A → C → B → D costs 2 + 1 + 5 = 8, cheaper than A → B → D at 9.",
          },
        }
      ),
    }),
    chapter(15, "Memory Management and B-Trees", {
      summary: "How memory is reclaimed, and trees built for disks.",
      lessons: lessons({
        heading: "B-trees",
        body: "A B-tree node holds many sorted keys, so the tree is wide and shallow. Fewer levels means fewer slow disk reads per search, which is why databases and file systems use them.",
        checkpoint: {
          prompt: "Why do B-trees have many keys per node?",
          options: ["To save RAM", "To keep the tree shallow, so fewer disk reads", "To allow duplicates", "To avoid rotations"],
          answer: 1,
          explanation: "Each level costs a disk access, so a high branching factor keeps searches cheap.",
        },
      }),
    }),
  ],
};
