
// Mock topic content for demonstration
export interface Topic {
  title: string;
  content: string;
}

export interface TopicsData {
  [subject: string]: Topic[];
}

export const mockTopics: TopicsData = {
  "mathematics": [
    {
      title: "Algebra Fundamentals",
      content: "Algebra is a branch of mathematics dealing with symbols and the rules for manipulating these symbols. In elementary algebra, those symbols (today written as Latin and Greek letters) represent quantities without fixed values, known as variables. The study of algebra encompasses everything from solving elementary equations to the study of abstractions such as groups, rings, and fields."
    },
    {
      title: "Calculus Basics",
      content: "Calculus is the mathematical study of continuous change, in the same way that geometry is the study of shape and algebra is the study of generalizations of arithmetic operations. It has two major branches: differential calculus and integral calculus."
    },
    {
      title: "Geometry Principles",
      content: "Geometry is a branch of mathematics concerned with questions of shape, size, relative position of figures, and the properties of space. It arose independently in many early cultures as a practical way of dealing with lengths, areas, and volumes."
    }
  ],
  "physics": [
    {
      title: "Classical Mechanics",
      content: "Classical mechanics describes the motion of macroscopic objects, from projectiles to parts of machinery, and astronomical objects, such as spacecraft, planets, stars, and galaxies."
    },
    {
      title: "Electromagnetism",
      content: "Electromagnetism is a branch of physics involving the study of the electromagnetic force, a type of physical interaction that occurs between electrically charged particles."
    }
  ],
  // Add more subjects and topics as needed
};
