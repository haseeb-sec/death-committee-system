from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
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
from app.services.committee import create_committee
from app.services.member import add_member


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
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


@pytest.fixture
def committee(db):
    committee = create_committee(
        db,
        name="Test Committee",
    )

    db.commit()

    return committee


@pytest.fixture
def member(db, committee):
    member = add_member(
        db,
        committee_id=committee.id,
        name="Test Member",
        joined_on=date(2026, 1, 1),
    )

    db.flush()

    return member
