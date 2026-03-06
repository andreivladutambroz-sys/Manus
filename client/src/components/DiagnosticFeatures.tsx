import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bookmark, X, Tag, StickyNote } from "lucide-react";
import { toast } from "sonner";

interface DiagnosticFeaturesProps {
  diagnosticId: number;
}

export function DiagnosticFeatures({ diagnosticId }: DiagnosticFeaturesProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");

  const bookmarkAdd = trpc.bookmark.add.useMutation();
  const bookmarkRemove = trpc.bookmark.remove.useMutation();
  const bookmarkList = trpc.bookmark.list.useQuery();
  
  const noteAdd = trpc.note.add.useMutation();
  const noteList = trpc.note.list.useQuery({ diagnosticId });
  const noteDelete = trpc.note.delete.useMutation();
  
  const tagAdd = trpc.tag.add.useMutation();
  const tagList = trpc.tag.list.useQuery({ diagnosticId });
  const tagRemove = trpc.tag.remove.useMutation();

  useEffect(() => {
    if (bookmarkList.data) {
      setIsBookmarked(bookmarkList.data.includes(diagnosticId));
    }
  }, [bookmarkList.data, diagnosticId]);

  useEffect(() => {
    if (noteList.data) {
      setNotes(noteList.data);
    }
  }, [noteList.data]);

  useEffect(() => {
    if (tagList.data) {
      setTags(tagList.data);
    }
  }, [tagList.data]);

  const handleToggleBookmark = () => {
    if (isBookmarked) {
      bookmarkRemove.mutate({ diagnosticId }, {
        onSuccess: () => {
          setIsBookmarked(false);
          toast.success("Eliminat din favorite");
        }
      });
    } else {
      bookmarkAdd.mutate({ diagnosticId }, {
        onSuccess: () => {
          setIsBookmarked(true);
          toast.success("Adăugat în favorite");
        }
      });
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      noteAdd.mutate({ diagnosticId, content: newNote }, {
        onSuccess: () => {
          setNotes([...notes, { id: Date.now(), content: newNote, createdAt: new Date() }]);
          setNewNote("");
          toast.success("Notă adăugată");
        }
      });
    }
  };

  const handleDeleteNote = (noteId: number) => {
    noteDelete.mutate({ noteId }, {
      onSuccess: () => {
        setNotes(notes.filter(n => n.id !== noteId));
        toast.success("Notă ștearsă");
      }
    });
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      tagAdd.mutate({ diagnosticId, tag: newTag }, {
        onSuccess: () => {
          setTags([...tags, newTag]);
          setNewTag("");
          toast.success("Etichetă adăugată");
        }
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    tagRemove.mutate({ diagnosticId, tag }, {
      onSuccess: () => {
        setTags(tags.filter(t => t !== tag));
        toast.success("Etichetă eliminată");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Bookmark Button */}
      <div className="flex gap-2">
        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="sm"
          onClick={handleToggleBookmark}
          className="gap-2"
        >
          {isBookmarked ? (
            <>
              <X className="w-4 h-4" />
              Elimina din favorite
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              Adaugă în favorite
            </>
          )}
        </Button>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="w-4 h-4" />
            Etichete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Adaugă etichetă..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddTag();
                }
              }}
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <Button size="sm" onClick={handleAddTag}>Adaugă</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="w-4 h-4" />
            Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-3">
            {notes.map((note) => (
              <div key={note.id} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-slate-700">{note.content}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</p>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Adaugă notă..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddNote();
                }
              }}
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <Button size="sm" onClick={handleAddNote}>Adaugă</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
