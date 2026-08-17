from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
from app.models import (
    Account,
    AssetParticipation,
    AssetOwnership,
    AssetValuation,
    Committee,
    CommitteeAsset,
    ContributionRate,
    DeathSupport,
    JournalEntry,
    JournalLine,
    Member,
    MemberDue,
    MemberGood,
    MemberGoodValuation,
    MemberSettlement,
)


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    TestingSession = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    session = TestingSession()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()
