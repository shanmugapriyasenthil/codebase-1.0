from dataclasses import dataclass, field


@dataclass
class CodeFunction:
    name: str
    code: str


@dataclass
class CodeFile:
    path: str
    language: str
    functions: list[CodeFunction] = field(default_factory=list)
    imports: list[str] = field(default_factory=list)
    relationships: list[dict] = field(default_factory=list)


@dataclass
class CodeChunk:
    file_path: str
    chunk_type: str
    name: str
    code: str