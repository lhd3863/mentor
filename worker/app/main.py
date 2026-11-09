"""멘토르 Python 워커: 수식 검증(SymPy) 등 무거운 작업을 맡는 FastAPI 서버."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sympy import simplify
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

app = FastAPI(title="멘토르 워커")

TRANSFORMS = standard_transformations + (convert_xor, implicit_multiplication_application)


class EquivalenceRequest(BaseModel):
    expected: str  # 정답 식, 예: "2*x + 2"
    answer: str  # 학생·AI 답, 예: "2(x+1)"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/verify/equivalent")
def verify_equivalent(req: EquivalenceRequest):
    """두 식이 수학적으로 같은지 확인한다 (문항 정답 검증용)."""
    try:
        a = parse_expr(req.expected, transformations=TRANSFORMS)
        b = parse_expr(req.answer, transformations=TRANSFORMS)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"식을 해석할 수 없음: {e}")
    return {"equivalent": simplify(a - b) == 0}
