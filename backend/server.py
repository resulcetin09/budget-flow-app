from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Models ====================

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

class CategoryCreate(BaseModel):
    name: str

class Income(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float
    source: str
    type: str  # "Aylık Sabit" or "Ek Gelir"
    date: datetime

class IncomeCreate(BaseModel):
    amount: float
    source: str
    type: str
    date: datetime

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float
    description: str
    date: datetime
    categoryId: str
    categoryName: Optional[str] = None

class ExpenseCreate(BaseModel):
    amount: float
    description: str
    date: datetime
    categoryId: str

class Debt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    totalAmount: float
    paidAmount: float = 0.0
    status: str = "Aktif"  # "Aktif" or "Ödendi"
    dueDate: Optional[datetime] = None

class DebtCreate(BaseModel):
    name: str
    totalAmount: float
    dueDate: Optional[datetime] = None

class DebtPayment(BaseModel):
    amount: float

class DashboardSummary(BaseModel):
    totalIncome: float
    totalExpense: float
    netBalance: float
    totalActiveDebt: float

class ExpenseAnalysis(BaseModel):
    period: str
    data: List[dict]
    categoryData: List[dict]

# ==================== Categories Routes ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    category = Category(**input.model_dump())
    doc = category.model_dump()
    await db.categories.insert_one(doc)
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, input: CategoryCreate):
    result = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.categories.update_one(
        {"id": category_id},
        {"$set": {"name": input.name}}
    )
    
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return Category(**updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ==================== Income Routes ====================

@api_router.get("/income", response_model=List[Income])
async def get_income():
    income_list = await db.income.find({}, {"_id": 0}).to_list(1000)
    for item in income_list:
        if isinstance(item['date'], str):
            item['date'] = datetime.fromisoformat(item['date'])
    return income_list

@api_router.post("/income", response_model=Income)
async def create_income(input: IncomeCreate):
    income = Income(**input.model_dump())
    doc = income.model_dump()
    doc['date'] = doc['date'].isoformat()
    await db.income.insert_one(doc)
    return income

@api_router.put("/income/{income_id}", response_model=Income)
async def update_income(income_id: str, input: IncomeCreate):
    result = await db.income.find_one({"id": income_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Income not found")
    
    update_data = input.model_dump()
    update_data['date'] = update_data['date'].isoformat()
    
    await db.income.update_one(
        {"id": income_id},
        {"$set": update_data}
    )
    
    updated = await db.income.find_one({"id": income_id}, {"_id": 0})
    if isinstance(updated['date'], str):
        updated['date'] = datetime.fromisoformat(updated['date'])
    return Income(**updated)

@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str):
    result = await db.income.delete_one({"id": income_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"message": "Income deleted successfully"}

# ==================== Expenses Routes ====================

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    
    # Get all categories
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    category_map = {cat['id']: cat['name'] for cat in categories}
    
    for item in expenses:
        if isinstance(item['date'], str):
            item['date'] = datetime.fromisoformat(item['date'])
        item['categoryName'] = category_map.get(item['categoryId'], 'Unknown')
    
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(input: ExpenseCreate):
    # Verify category exists
    category = await db.categories.find_one({"id": input.categoryId}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    expense = Expense(**input.model_dump())
    expense.categoryName = category['name']
    doc = expense.model_dump()
    doc['date'] = doc['date'].isoformat()
    await db.expenses.insert_one(doc)
    return expense

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, input: ExpenseCreate):
    result = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Verify category exists
    category = await db.categories.find_one({"id": input.categoryId}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = input.model_dump()
    update_data['date'] = update_data['date'].isoformat()
    update_data['categoryName'] = category['name']
    
    await db.expenses.update_one(
        {"id": expense_id},
        {"$set": update_data}
    )
    
    updated = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if isinstance(updated['date'], str):
        updated['date'] = datetime.fromisoformat(updated['date'])
    return Expense(**updated)

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# ==================== Debts Routes ====================

@api_router.get("/debts", response_model=List[Debt])
async def get_debts():
    debts = await db.debts.find({}, {"_id": 0}).to_list(1000)
    for item in debts:
        if item.get('dueDate') and isinstance(item['dueDate'], str):
            item['dueDate'] = datetime.fromisoformat(item['dueDate'])
    return debts

@api_router.post("/debts", response_model=Debt)
async def create_debt(input: DebtCreate):
    debt = Debt(**input.model_dump())
    doc = debt.model_dump()
    if doc.get('dueDate'):
        doc['dueDate'] = doc['dueDate'].isoformat()
    await db.debts.insert_one(doc)
    return debt

@api_router.patch("/debts/{debt_id}/pay", response_model=Debt)
async def pay_debt(debt_id: str, payment: DebtPayment):
    debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    new_paid_amount = debt['paidAmount'] + payment.amount
    new_status = "Ödendi" if new_paid_amount >= debt['totalAmount'] else "Aktif"
    
    await db.debts.update_one(
        {"id": debt_id},
        {"$set": {"paidAmount": new_paid_amount, "status": new_status}}
    )
    
    updated = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if updated.get('dueDate') and isinstance(updated['dueDate'], str):
        updated['dueDate'] = datetime.fromisoformat(updated['dueDate'])
    return Debt(**updated)

@api_router.put("/debts/{debt_id}", response_model=Debt)
async def update_debt(debt_id: str, input: DebtCreate):
    result = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    update_data = input.model_dump()
    if update_data.get('dueDate'):
        update_data['dueDate'] = update_data['dueDate'].isoformat()
    
    await db.debts.update_one(
        {"id": debt_id},
        {"$set": update_data}
    )
    
    updated = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if updated.get('dueDate') and isinstance(updated['dueDate'], str):
        updated['dueDate'] = datetime.fromisoformat(updated['dueDate'])
    return Debt(**updated)

@api_router.delete("/debts/{debt_id}")
async def delete_debt(debt_id: str):
    result = await db.debts.delete_one({"id": debt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Debt not found")
    return {"message": "Debt deleted successfully"}

# ==================== Dashboard Routes ====================

@api_router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary():
    # Get current month's start and end
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    if now.month == 12:
        end_of_month = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_of_month = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
    
    # Get income for this month
    income_list = await db.income.find({}, {"_id": 0}).to_list(1000)
    total_income = 0.0
    for item in income_list:
        item_date = datetime.fromisoformat(item['date']) if isinstance(item['date'], str) else item['date']
        if item_date.replace(tzinfo=timezone.utc) >= start_of_month and item_date.replace(tzinfo=timezone.utc) < end_of_month:
            total_income += item['amount']
    
    # Get expenses for this month
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    total_expense = 0.0
    for item in expenses:
        item_date = datetime.fromisoformat(item['date']) if isinstance(item['date'], str) else item['date']
        if item_date.replace(tzinfo=timezone.utc) >= start_of_month and item_date.replace(tzinfo=timezone.utc) < end_of_month:
            total_expense += item['amount']
    
    # Get active debts
    debts = await db.debts.find({"status": "Aktif"}, {"_id": 0}).to_list(1000)
    total_active_debt = sum(debt['totalAmount'] - debt['paidAmount'] for debt in debts)
    
    return DashboardSummary(
        totalIncome=total_income,
        totalExpense=total_expense,
        netBalance=total_income - total_expense,
        totalActiveDebt=total_active_debt
    )

@api_router.get("/dashboard/expenses-analysis")
async def get_expenses_analysis(period: str = "monthly"):
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    category_map = {cat['id']: cat['name'] for cat in categories}
    
    now = datetime.now(timezone.utc)
    
    # Filter by period
    filtered_expenses = []
    for exp in expenses:
        exp_date = datetime.fromisoformat(exp['date']) if isinstance(exp['date'], str) else exp['date']
        exp_date = exp_date.replace(tzinfo=timezone.utc)
        
        if period == "daily":
            if exp_date.date() == now.date():
                filtered_expenses.append(exp)
        elif period == "weekly":
            week_ago = now - timedelta(days=7)
            if exp_date >= week_ago:
                filtered_expenses.append(exp)
        else:  # monthly
            start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
            if exp_date >= start_of_month:
                filtered_expenses.append(exp)
    
    # Group by date for bar chart
    date_totals = defaultdict(float)
    date_order = {}  # To maintain proper date ordering
    
    for exp in filtered_expenses:
        exp_date = datetime.fromisoformat(exp['date']) if isinstance(exp['date'], str) else exp['date']
        
        if period == "daily":
            key = exp_date.strftime("%H:00")
            sort_key = exp_date.strftime("%H")
        elif period == "weekly":
            key = exp_date.strftime("%a")  # Day name (Mon, Tue, etc.)
            sort_key = exp_date.strftime("%Y%m%d")
        else:  # monthly
            key = f"{exp_date.day}"
            sort_key = exp_date.day
        
        date_totals[key] += exp['amount']
        if key not in date_order:
            date_order[key] = sort_key
    
    # Sort by actual date order
    bar_data = [{"date": k, "amount": date_totals[k]} for k in sorted(date_order.keys(), key=lambda x: date_order[x])]
    
    # Group by category for pie chart
    category_totals = defaultdict(float)
    for exp in filtered_expenses:
        cat_name = category_map.get(exp['categoryId'], 'Unknown')
        category_totals[cat_name] += exp['amount']
    
    pie_data = [{"name": k, "value": v} for k, v in category_totals.items()]
    
    return {
        "period": period,
        "barData": bar_data,
        "pieData": pie_data
    }

@api_router.get("/dashboard/recent-transactions")
async def get_recent_transactions():
    # Get last 5 income and expenses
    income_list = await db.income.find({}, {"_id": 0}).sort("date", -1).limit(5).to_list(5)
    expenses = await db.expenses.find({}, {"_id": 0}).sort("date", -1).limit(5).to_list(5)
    
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    category_map = {cat['id']: cat['name'] for cat in categories}
    
    transactions = []
    
    for inc in income_list:
        transactions.append({
            "type": "income",
            "amount": inc['amount'],
            "description": inc['source'],
            "date": inc['date'] if isinstance(inc['date'], str) else inc['date'].isoformat(),
            "category": inc['type']
        })
    
    for exp in expenses:
        transactions.append({
            "type": "expense",
            "amount": exp['amount'],
            "description": exp['description'],
            "date": exp['date'] if isinstance(exp['date'], str) else exp['date'].isoformat(),
            "category": category_map.get(exp['categoryId'], 'Unknown')
        })
    
    # Sort by date descending
    transactions.sort(key=lambda x: x['date'], reverse=True)
    
    return transactions[:10]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
